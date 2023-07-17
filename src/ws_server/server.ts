import { WebSocketServer } from 'ws';
import Game from './model/gameModel.js';

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}, http://localhost:${port}/...`),
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      Game.start(msg.toString(), ws, wss);
    });

    ws.on('close', () => {
      Game.deleteRoomOnDisconnect(ws, wss);
    });
  });
};
