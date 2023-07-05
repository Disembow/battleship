import { WebSocketServer } from 'ws';
import { IRegRequest } from './types/types.js';

// const db = {};

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`)
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = JSON.parse(msg.toString()) as IRegRequest;

      switch (type) {
        case 'reg':
          const res = JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name: data.name,
              index: 0,
              error: false,
              errorText: '',
            }),
          });

          ws.send(res);

          const update_room = JSON.stringify({
            type: 'update_room',
            data: [
              JSON.stringify({
                roomId: 5,
                roomUsers: {
                  name: data.name,
                  index: 5,
                },
              }),
            ],
          });

          ws.send(update_room);
          break;

        case 'create_room':
          const response = [];
          // ws.send()
          break;
      }
    });
  });
};
