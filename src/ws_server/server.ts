import { WebSocket, WebSocketServer } from 'ws';
import { Commands, IRegRequest, IRegRequestData } from './types/types.js';
import db from './db/db.js';
import { validateAuth } from './utils/validateAuth.js';

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`)
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = <IRegRequest>JSON.parse(msg.toString());

      switch (type) {
        case Commands.Reg:
          const { name, password } = <IRegRequestData>JSON.parse(data);

          const index = db.getUserId();
          db.setUser(index, { name, password });

          const [error, errorText] = validateAuth(name, password);

          const res = JSON.stringify({
            type: Commands.Reg,
            data: JSON.stringify({
              name,
              index,
              error,
              errorText,
            }),
          });

          ws.send(res);
          break;

        case Commands.CreateRoom:
          const update = JSON.stringify({
            type: Commands.UpdateRoom,
            data: JSON.stringify([
              {
                roomId: 1,
                roomUsers: [
                  {
                    name: db.users.get(1)?.name,
                    index: 1,
                  },
                ],
              },
            ]),
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(update);
            }
          });

          break;

        case Commands.AddUserToRoom:
          const indexRoom = JSON.parse(data);

          const createdRoom = JSON.stringify({
            type: Commands.CreateGame,
            data: JSON.stringify({
              idGame: indexRoom,
              idPlayer: 1,
            }),
          });

          //!TODO: add response for only to players
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(createdRoom);
            }
          });

          const updatedAfterCreate = JSON.stringify({
            type: Commands.UpdateRoom,
            data: JSON.stringify([
              {
                roomId: 1,
                roomUsers: [],
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
    });
  });
};
