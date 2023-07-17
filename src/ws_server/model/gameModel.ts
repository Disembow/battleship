import { WebSocket, WebSocketServer } from 'ws';
import { GameController } from '../controller/gameController.js';
import { Commands, IRegRequest } from '../types/types.js';

class Game extends GameController {
  constructor() {
    super();
  }

  start(msg: string, ws: WebSocket, wss: WebSocketServer) {
    const { type, data } = <IRegRequest>JSON.parse(msg.toString());

    switch (type) {
      case Commands.Reg: {
        this.createUser(data, ws, wss);
        break;
      }

      case Commands.CreateRoom: {
        this.createRoom(ws, wss);
        break;
      }

      case Commands.AddUserToRoom: {
        this.addUserToRoom(data, ws, wss);
        break;
      }

      case Commands.AddShips: {
        this.addShips(data, ws);
        break;
      }

      case Commands.Attack: {
        this.makeShot(data, ws, wss);
        break;
      }

      case Commands.RandomAttack: {
        this.randomAttack(data, ws, wss);
        break;
      }

      case Commands.SinglePlay: {
        this.createSinglePlay(ws);
        break;
      }
    }
  }
}

export default new Game();
