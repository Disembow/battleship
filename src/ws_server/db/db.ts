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

export type StartingField = {
  gameId: number;
  indexPlayer: number;
  ships: TShipInfo[];
};

type TRoomUser = {
  index: number;
  ships: TShipInfo[];
};

// interface IRoom {
//   // roomId: number;
//   roomUsers: TRoomUser;
// }

interface IUser {
  index: number;
  name: string;
  password: string;
}

class InMemoryDatabase {
  users;
  lastUserId: number;

  constructor() {
    this.users = new Map<WebSocket, IUser>();
    this.lastUserId = 0;
  }

  public setUser(key: WebSocket, value: IUser) {
    this.users.set(key, value);
  }

  public getUser(key: WebSocket) {
    return this.users.get(key);
  }

  public getUserId() {
    this.lastUserId += 1;
    return this.lastUserId;
  }
}

export default new InMemoryDatabase();
