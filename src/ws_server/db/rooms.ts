import { WebSocket } from 'ws';
import { AttackStatus } from '../types/types.js';

enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

type TShips = Array<Array<string>>;

export type TShipInfo = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: typeof ShipType;
};

export interface IGame {
  [key: number]: {
    ships: TShipInfo[];
  };
  ws: WebSocket[];
  ids: number[];
  turn: number;
}

interface IRoomDB {
  shot(target: string, init: TShips, killed: TShips): AttackStatus;
}

class RoomsDB implements IRoomDB {
  private rooms;
  private games;
  private lastRoomId: number;
  private lastGameId: number;

  constructor() {
    // Each room contains an array of websockets
    this.rooms = new Map<number, WebSocket[]>();
    // Each game contains an object with keys as userId & value as ship stat
    this.games = new Map<number, IGame>();

    this.lastRoomId = 0;
    this.lastGameId = 0;
  }

  public setRoom(roomId: number, value: WebSocket): void {
    this.rooms.set(roomId, [value]);
  }

  public getRoom(roomId: number): WebSocket[] | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomId(): number {
    this.lastRoomId += 1;
    return this.lastRoomId;
  }

  public setGame(gameId: number, gameState: IGame): void {
    this.games.set(gameId, gameState);
  }

  public findGameById(gameId: number): IGame | undefined {
    return this.games.get(gameId);
  }

  public getGameId(): number {
    this.lastGameId += 1;
    return this.lastGameId;
  }

  public selectFirstPlayerToTurn() {
    return Math.round(Math.random());
  }

  public changeTurnByRoomId(id: number) {}

  public shot(target: string, init: TShips, killed: TShips) {
    let result = AttackStatus.Miss;

    init.forEach((ship, shipIndex) => {
      ship.forEach((coord, coordIndex) => {
        if (coord === target) {
          killed[shipIndex][coordIndex] = target;
          result = AttackStatus.Shot;
        }

        init.forEach((e, i) => {
          if (JSON.stringify(e) === JSON.stringify(killed[i])) {
            init.splice(i, 1);
            killed.splice(i, 1);

            result = AttackStatus.Killed;
          }
        });
      });
    });

    return result;
  }
}

export default new RoomsDB();
