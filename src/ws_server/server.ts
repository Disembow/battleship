import { WebSocket, WebSocketServer } from 'ws';
import { IRegRequest, IRegRequestData } from './types/types.js';
import db from './db/db.js';
import { validateAuth } from './utils/validateAuth.js';
import { create } from 'domain';

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`)
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = <IRegRequest>JSON.parse(msg.toString());

      switch (type) {
        case 'reg':
          const { name, password } = <IRegRequestData>JSON.parse(data);

          const index = db.getUserId();

          db.setUser(index, { name, password });

          const [error, errorText] = validateAuth(name, password);

          const res = JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name,
              index,
              error,
              errorText,
            }),
          });

          ws.send(res);

          console.log(db.users);

          // const update_room = JSON.stringify({
          //   type: 'update_room',
          //   data: [
          //     JSON.stringify({
          //       roomId: 1,
          //       roomUsers: {
          //         name,
          //         index: 1,
          //       },
          //     }),
          //   ],
          // });

          // if (!error) ws.send(update_room);
          break;

        case 'create_room':
          const update = JSON.stringify({
            type: 'update_room',
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

          // const createdRoom = JSON.stringify({
          //   type: 'create_game',
          //   data: JSON.stringify({
          //     idGame: 1,
          //     idPlayer: 1,
          //   }),
          // });

          // ws.send(createdRoom);
          break;
      }
    });
  });
};
