import { WebSocket } from 'ws';

interface IUser {
  index: number;
  name: string;
  password: string;
}

export class Users {
  db;
  lastUserId: number;

  constructor() {
    this.db = new Map<WebSocket, IUser>();
    this.lastUserId = 0;
  }

  public setUser(key: WebSocket, value: IUser) {
    this.db.set(key, value);
  }

  public getUser(key: WebSocket) {
    return this.db.get(key);
  }

  public getUserId() {
    this.lastUserId += 1;
    return this.lastUserId;
  }
}

export default new Users();
