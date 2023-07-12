import { WebSocket } from 'ws';

type TUser = {
  index: number;
  name: string;
  password: string;
};

interface IUsers {
  setUser(key: WebSocket, value: TUser): void;
  getUser(key: WebSocket): TUser | undefined;
  getUserId(): number;
}

export class Users implements IUsers {
  db;
  lastUserId: number;

  constructor() {
    this.db = new Map<WebSocket, TUser>();
    this.lastUserId = 0;
  }

  public setUser(key: WebSocket, value: TUser): void {
    this.db.set(key, value);
  }

  public getUser(key: WebSocket): TUser | undefined {
    return this.db.get(key);
  }

  public getUserId(): number {
    this.lastUserId += 1;
    return this.lastUserId;
  }
}

export default new Users();
