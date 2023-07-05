import { httpServer } from './src/http_server/index.js';
import { ws_server } from './src/ws_server/server.js';

const HTTP_PORT = 8181;
const WEBSOCKET_PORT = 3000;

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

ws_server(WEBSOCKET_PORT);
