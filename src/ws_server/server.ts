import { WebSocket, WebSocketServer } from 'ws';
import { AddUserToRoomReq, Commands, IRegRequest, IRegRequestData } from './types/types.js';
import Users from './db/users.js';
import { validateAuth } from './utils/validateAuth.js';
import Rooms, { IGame, StartingFieldReq } from './db/rooms.js';
import rooms from './db/rooms.js';
import { USERS_PER_GAME } from './constants.js';

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
          const newRoomId = Rooms.getRoomId();

          Rooms.setRoom(newRoomId, ws);

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
          const players = rooms.getRoom(indexRoom);
          players?.push(ws);

          if (players?.length === USERS_PER_GAME) {
            const idGame = Rooms.getGameId();

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

        case Commands.AddShips:
          const { gameId, indexPlayer, ships } = <StartingFieldReq>JSON.parse(data);
          const game = rooms.findGamyById(gameId);

          if (!game) {
            const newGame = {} as IGame;
            newGame[indexPlayer] = {
              ships,
            };
            rooms.setGame(gameId, newGame);
          } else {
            game[indexPlayer] = {
              ships,
            };
          }

          console.log(ships);
          break;
      }
    });
  });
};
