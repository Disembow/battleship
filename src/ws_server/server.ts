import { WebSocket, WebSocketServer } from 'ws';
import {
  AddUserToRoomReq,
  Attack,
  AttackStatus,
  Commands,
  IGame,
  IRegRequest,
  IRegRequestData,
  StartingFieldReq,
} from './types/types.js';
import UsersDB from './db/users.js';
import RoomsDB from './db/rooms.js';
import { validateAuth } from './utils/validateAuth.js';
import { FIELD_SIDE_SIZE, USERS_PER_GAME } from './constants.js';
import { getEmptyArray } from './utils/getEmptyArray.js';
import { updateRooms } from './utils/updateRooms.js';

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`),
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = <IRegRequest>JSON.parse(msg.toString());

      switch (type) {
        case Commands.Reg: {
          const { name, password } = <IRegRequestData>JSON.parse(data);

          const index = UsersDB.getUserId();
          UsersDB.setUser(ws, { index, name, password });

          const [error, errorText] = validateAuth(name, password);

          const response = JSON.stringify({
            type: Commands.Reg,
            data: JSON.stringify({
              name,
              index,
              error,
              errorText,
            }),
          });

          ws.send(response);

          // Update rooms state
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updateRooms());
            }
          });
          break;
        }

        case Commands.CreateRoom: {
          const newRoomId = RoomsDB.getRoomId();
          const name = UsersDB.db.get(ws)?.name;
          const index = UsersDB.db.get(ws)?.index;

          if (name && index) RoomsDB.setRoom(newRoomId, ws, name, index);

          // Update rooms state
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updateRooms());
            }
          });
          break;
        }

        case Commands.AddUserToRoom: {
          const { indexRoom } = <AddUserToRoomReq>JSON.parse(data);
          const players = RoomsDB.getRoomById(indexRoom);
          players?.usersWS.push(ws);

          if (players?.usersWS.length === USERS_PER_GAME) {
            const idGame = RoomsDB.getGameId();

            players.usersWS.forEach((client) => {
              const createdRoom = JSON.stringify({
                type: Commands.CreateGame,
                data: JSON.stringify({
                  idGame,
                  idPlayer: UsersDB.db.get(client)?.index, //TODO: update
                }),
              });

              if (client.readyState === WebSocket.OPEN) {
                client.send(createdRoom);
              }
            });

            const updatedAfterCreate = JSON.stringify({
              type: Commands.UpdateRoom,
              data: JSON.stringify([
                {
                  //TODO: delete room by id
                  roomId: 0,
                  roomUsers: [],
                },
              ]),
            });

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(updatedAfterCreate);
              }
            });
          }
          break;
        }

        case Commands.AddShips: {
          const { gameId, indexPlayer, ships } = <StartingFieldReq>JSON.parse(data);
          const game = RoomsDB.findGameById(gameId);
          const shipsCoords = RoomsDB.createInitialShipState(ships);
          const killed = getEmptyArray(FIELD_SIDE_SIZE);

          // Fill the initial game state on add_ships event
          if (!game) {
            const newGame = { usersInGame: [ws], ids: [indexPlayer] } as IGame;
            newGame[indexPlayer] = {
              ships,
              shipsCoords,
              killed,
            };
            RoomsDB.setGame(gameId, newGame);
          } else {
            game[indexPlayer] = {
              ships,
              shipsCoords,
              killed,
            };
            game.usersInGame.push(ws);
            game.ids.push(indexPlayer);
          }

          // Send message to players with their initial state & first turn
          if (game?.usersInGame.length === USERS_PER_GAME) {
            const firstPlayer = RoomsDB.selectFirstPlayerToTurn();

            game.usersInGame.forEach((client) => {
              const userId = UsersDB.getUser(client)?.index!;

              const startState = JSON.stringify({
                type: Commands.StartGame,
                data: game[userId].ships,
                currentPlayerIndex: userId,
              });

              client.send(startState);

              game.turn = game.ids[firstPlayer];

              const turn = JSON.stringify({
                type: Commands.Turn,
                data: JSON.stringify({
                  currentPlayer: game.turn,
                }),
              });

              client.send(turn);
            });
          }
          break;
        }

        case Commands.Attack: {
          const { gameId, x, y, indexPlayer } = <Attack>JSON.parse(data);
          const game = RoomsDB.findGameById(gameId)!;
          const { ids, turn, usersInGame } = game;

          const secondPlayerId = ids[ids.indexOf(indexPlayer) === 0 ? 1 : 0];
          const shipsCoords = game[secondPlayerId].shipsCoords;
          const killedCoords = game[secondPlayerId].killed;

          // send attack response
          const status = RoomsDB.shot(`${x}-${y}`, shipsCoords, killedCoords);

          if (turn === indexPlayer) {
            usersInGame.forEach((e) => {
              const attack = JSON.stringify({
                type: Commands.Attack,
                data: JSON.stringify({
                  position: {
                    x,
                    y,
                  },
                  currentPlayer: indexPlayer,
                  status,
                }),
              });

              e.send(attack);

              // send next turn //TODO: send miss status after killing the ship
              let nextTurn;
              if (status === AttackStatus.Miss) {
                nextTurn = JSON.stringify({
                  type: Commands.Turn,
                  data: JSON.stringify({
                    currentPlayer: secondPlayerId,
                  }),
                });

                game.turn = secondPlayerId;
              } else {
                nextTurn = JSON.stringify({
                  type: Commands.Turn,
                  data: JSON.stringify({
                    currentPlayer: indexPlayer,
                  }),
                });
              }

              // win case //TODO check rooms state
              if (shipsCoords.length === 0) {
                const finishGame = JSON.stringify({
                  type: Commands.Finish,
                  data: JSON.stringify({
                    winPlayer: indexPlayer,
                  }),
                });

                e.send(finishGame);

                RoomsDB.updateWinner(UsersDB.getUser(ws)!.name);

                const winners = JSON.stringify({
                  type: Commands.UpdateWinners,
                  data: JSON.stringify(RoomsDB.getAllWinners()),
                });

                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(winners);
                  }
                });
              } else {
                e.send(nextTurn);
              }
            });
          }

          break;
        }
      }
    });
  });
};
