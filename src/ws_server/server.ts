import { WebSocketServer } from 'ws';
import { Commands, IRegRequest, StartingFieldReq } from './types/types.js';
import Game from './game.js';
import { FIELD_SIDE_SIZE } from './data/constants.js';
import { randomShotCoords } from './utils/randomShotCoords.js';

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
          Game.createUser(data, ws, wss);
          break;
        }

        case Commands.CreateRoom: {
          Game.createRoom(ws, wss);
          break;
        }

        case Commands.AddUserToRoom: {
          Game.addUserToRoom(data, ws, wss);
          break;
        }

        case Commands.AddShips: {
          Game.addShips(data, ws);
          break;
        }

        case Commands.Attack: {
          Game.makeShot(data, ws, wss);
          break;
        }

        case Commands.RandomAttack: {
          Game.randomAttack(data, ws, wss);
          break;
        }

        case Commands.SinglePlay: {
          //TODO: implement
          break;
        }
      }
    });
  });
};
