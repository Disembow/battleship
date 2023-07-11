import { WebSocket, WebSocketServer } from 'ws';
import {
  AddUserToRoomReq,
  Attack,
  AttackStatus,
  Commands,
  IRegRequest,
  IRegRequestData,
  StartingFieldReq,
} from './types/types.js';
import Users from './db/users.js';
import { validateAuth } from './utils/validateAuth.js';
import RoomsDB, { IGame } from './db/rooms.js';
import { FIELD_SIDE_SIZE, USERS_PER_GAME } from './constants.js';
import { getEmptyArray } from './utils/getEmptyArray.js';

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

          const index = Users.getUserId();
          Users.setUser(ws, { index, name, password });

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

          //TODO: add room update by user log in

          ws.send(response);
          break;
        }

        case Commands.CreateRoom: {
          //TODO: add multi rooms
          const newRoomId = RoomsDB.getRoomId();

          RoomsDB.setRoom(newRoomId, ws);

          const response = JSON.stringify({
            type: Commands.UpdateRoom,
            data: JSON.stringify([
              {
                roomId: newRoomId,
                roomUsers: [
                  {
                    name: Users.db.get(ws)?.name,
                    index: Users.db.get(ws)?.index,
                  },
                ],
              },
            ]),
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(response);
            }
          });
          break;
        }

        case Commands.AddUserToRoom: {
          const { indexRoom } = <AddUserToRoomReq>JSON.parse(data);
          const players = RoomsDB.getRoom(indexRoom);
          players?.push(ws);

          if (players?.length === USERS_PER_GAME) {
            const idGame = RoomsDB.getGameId();

            players.forEach((client) => {
              const createdRoom = JSON.stringify({
                type: Commands.CreateGame,
                data: JSON.stringify({
                  idGame,
                  idPlayer: Users.db.get(client)?.index, //TODO: update
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
              const userId = Users.getUser(client)?.index!;

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

              // send next turn
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

                RoomsDB.updateWinner(Users.getUser(ws)!.name);

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
