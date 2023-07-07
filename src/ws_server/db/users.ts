import { WebSocket } from 'ws';

interface IUser {
  index: number;
  name: string;
  password: string;
}

class Users {
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

export default new Users();
