import { WebSocket } from 'ws';
import { TUser } from '../types/types.js';

interface IUsers {
  setUser(key: WebSocket, value: TUser): void;
  getUser(key: WebSocket): TUser | undefined;
  getUserId(): number;
  validateAuth(name: string, password: string): (string | boolean)[];
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

  public validateAuth(name: string, password: string): (string | boolean)[] {
    if (!this.regex.test(name) && this.regex.test(password)) {
      return [true, 'Name must have minimum 5 chars length'];
    } else if (this.regex.test(name) && !this.regex.test(password)) {
      return [true, 'Password must have minimum 5 chars length'];
    } else if (!this.regex.test(name) && !this.regex.test(password)) {
      return [true, 'Name and password must have minimum 5 chars length'];
    } else {
      return [false, ''];
    }
  }
}
