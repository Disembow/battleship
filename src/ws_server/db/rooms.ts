import { WebSocket } from 'ws';

enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

type TShipInfo = {
  position: '';
  direction: boolean;
  type: typeof ShipType;
};

export type StartingFieldReq = {
  gameId: number;
  indexPlayer: number;
  ships: TShipInfo[];
};

// type TRoomUser = {
//   index: number;
//   ships: TShipInfo[];
// };

interface IRoom {}

interface IGame {}

class Rooms {
  rooms;
  games;
  lastRoomId: number;
  lastGameId: number;

  constructor() {
    this.rooms = new Map<number, WebSocket[]>();
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

  public addUserToRoom(roomId: number, ws: WebSocket): void {
    this.rooms.get(roomId)?.push(ws);
  }

  public setGame(key: number, value: WebSocket): void {
    this.rooms.set(key, [value]);
  }

  public getGameId(): number {
    this.lastGameId += 1;
    return this.lastGameId;
  }
}

export default new Rooms();
