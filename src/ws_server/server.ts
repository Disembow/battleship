import { WebSocketServer } from 'ws';

// const db = {};

interface TRegRequest {
  type: string;
  data: {
    name: string;
    password: string;
  };
  id: 0;
}

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port: port }, () =>
    console.log(`Websocket server has been started on port ${port}...`)
  );

  wss.on('connection', (client) => {
    client.on('message', async (msg) => {
      const { data } = JSON.parse(msg.toString()) as TRegRequest;
      console.log(data);
    });
  });
};
