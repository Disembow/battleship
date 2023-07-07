import { WebSocket } from 'ws';

enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

type TShipInfo = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  type: typeof ShipType;
};

export type StartingFieldReq = {
  gameId: number;
  indexPlayer: number;
  ships: TShipInfo[];
};

export interface IGame {
  [key: number]: {
    ships: TShipInfo[];
  };
}

class Rooms {
  rooms;
  games;
  lastRoomId: number;
  lastGameId: number;

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

  public addUserToRoom(roomId: number, ws: WebSocket): void {
    this.rooms.get(roomId)?.push(ws);
  }

  public setGame(gameId: number, gameState: IGame): void {
    this.games.set(gameId, gameState);
  }

  // public addSecondUserToGame(gameId) {}

  public findGamyById(gameId: number): IGame | undefined {
    return this.games.get(gameId);
  }

  public getGameId(): number {
    this.lastGameId += 1;
    return this.lastGameId;
  }
}

export default new Rooms();
