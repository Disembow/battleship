import { WebSocket } from 'ws';
import { TUser } from '../types/types.js';

interface IUsers {
  setUser(key: WebSocket, value: TUser): void;
  getUser(key: WebSocket): TUser | undefined;
  getUserId(): number;
  validateAuth(name: string, password: string, ws: WebSocket): (string | boolean)[];
}

export class UsersDB implements IUsers {
  db;
  lastUserId: number;
  regex: RegExp;

  constructor() {
    this.db = new Map<WebSocket, TUser>();
    this.lastUserId = 0;
    this.regex = /^.{5,}$/;
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

  private getUserKeyByName(name: string): WebSocket | null {
    for (let [key, value] of this.db.entries()) {
      if (value.name === name) {
        return key;
      }
    }

    return null;
  }

  public validateAuth(username: string, password: string, ws: WebSocket): (string | boolean)[] {
    const key = this.getUserKeyByName(username);

    if (!key) {
      if (!this.regex.test(username) && this.regex.test(password)) {
        return [true, 'Name must have minimum 5 chars length'];
      } else if (this.regex.test(username) && !this.regex.test(password)) {
        return [true, 'Password must have minimum 5 chars length'];
      } else if (!this.regex.test(username) && !this.regex.test(password)) {
        return [true, 'Name and password must have minimum 5 chars length'];
      } else {
        return [false, ''];
      }
    } else {
      const name = this.getUser(key)!.name;
      const currPassword = this.getUser(key)!.password;
      const index = this.getUser(key)!.index;

      if (currPassword !== password) {
        return [true, 'Wrong password'];
      } else {
        this.db.delete(key);
        this.setUser(key, { index, name, password: currPassword });
        return [false, ''];
      }
    }
  }
}
