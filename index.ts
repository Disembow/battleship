import { config } from 'dotenv';
import { http_server } from './src/http_server/index.js';
import { ws_server } from './src/ws_server/server.js';

config();

const HTTP_PORT = Number(process.env.HTTP_PORT) ?? 8181;
const WEBSOCKET_PORT = Number(process.env.WEBSOCKET_PORT) ?? 3000;

http_server(HTTP_PORT);
ws_server(WEBSOCKET_PORT);
