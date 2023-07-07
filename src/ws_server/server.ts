import { WebSocket, WebSocketServer } from 'ws';
import { Commands, IRegRequest, IRegRequestData } from './types/types.js';
import db, { StartingField } from './db/db.js';
import { validateAuth } from './utils/validateAuth.js';

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

          const index = db.getUserId();
          db.setUser(ws, { index, name, password });

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
          break;
        }

        case Commands.CreateRoom: {
          //TODO: add multi rooms
          const response = JSON.stringify({
            type: Commands.UpdateRoom,
            data: JSON.stringify([
              {
                roomId: db.getRoomId(),
                roomUsers: [
                  {
                    name: db.users.get(ws)?.name,
                    index: db.users.get(ws)?.index,
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
          const indexRoom = JSON.parse(data);

          //!TODO: add response for only to players
          wss.clients.forEach((client) => {
            const createdRoom = JSON.stringify({
              type: Commands.CreateGame,
              data: JSON.stringify({
                idGame: 1, //TODO: update
                idPlayer: db.users.get(client)?.index, //TODO: update
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
                roomId: 0, //TODO: update
                roomUsers: [], //TODO: delete room by id
              },
            ]),
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updatedAfterCreate);
            }
          });

          break;
        }

        case Commands.AddShips:
          const { gameId, indexPlayer, ships } = <StartingField>JSON.parse(data);

          console.log(gameId, indexPlayer, ships);

          // wss.clients.forEach((client) => {
          //   if (client.readyState === WebSocket.OPEN) {
          //     client.send(createdRoom);
          //   }
          // });

          break;
      }
    });
  });
};
