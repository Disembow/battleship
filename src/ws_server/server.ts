import { WebSocketServer } from 'ws';
import { IRegRequest, IRegRequestData } from './types/types.js';
import { Rooms, Users } from './db/db.js';
import { LAST_ROOM_ID, LAST_USER_ID, generateUserId } from './utils/idGeneretors.js';
import { validateAuth } from './utils/validateAuth.js';

// const db = {};

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`)
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = <IRegRequest>JSON.parse(msg.toString());
      const { name, password } = <IRegRequestData>JSON.parse(data);

      switch (type) {
        case 'reg':
          Users.set(generateUserId(LAST_USER_ID), { name, password });
          console.log(Users);

          const [error, errorText] = validateAuth(name, password);

          const res = JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name,
              index: LAST_USER_ID,
              error,
              errorText,
            }),
          });

          ws.send(res);

          const update_room = JSON.stringify({
            type: 'update_room',
            data: [
              JSON.stringify({
                roomId: 5,
                roomUsers: {
                  name,
                  index: 5,
                },
              }),
            ],
          });

          if (!error) ws.send(update_room);
          break;

        case 'create_room':
          // Rooms.set(generateUserId(LAST_ROOM_ID), {});

          const update = JSON.stringify({
            type: 'update_room',
            data: [
              JSON.stringify({
                roomId: 5,
                roomUsers: {
                  name: Users.get(LAST_USER_ID),
                  index: LAST_USER_ID,
                },
              }),
            ],
          });

          ws.send(update);
          break;
      }
    });
  });
};
