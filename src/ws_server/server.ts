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
import { getCoordsAroundShip } from './utils/getCoordsAroundShip.js';
import { attackShip } from './utils/attackShip.js';
import { createGame } from './utils/createGame.js';
import { randomShotCoords } from './utils/randomShotCoords.js';

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

          const a = 5;

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
              if (client.readyState === WebSocket.OPEN) {
                client.send(createGame(idGame, client));
              }
            });

            RoomsDB.deleteRoomById(indexRoom);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(updateRooms());
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
          RoomsDB.makeShot(data, ws, wss);
          break;
        }

        case Commands.RandomAttack: {
          const { gameId, indexPlayer } = <Pick<StartingFieldReq, 'gameId' | 'indexPlayer'>>(
            JSON.parse(data)
          );

          const [x, y] = randomShotCoords(0, FIELD_SIDE_SIZE);
          const newData = JSON.stringify({ gameId, x, y, indexPlayer });
          RoomsDB.makeShot(newData, ws, wss);
          break;
        }
      }
    });
  });
};
