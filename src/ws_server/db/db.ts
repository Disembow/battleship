type TRoomUser = {
  name: string;
  index: number;
};

interface IRoom {
  roomId: number;
  roomUsers: TRoomUser[];
}

interface IUser {
  name: string;
  password: string;
}

class InMemoryDatabase {
  users;
  rooms;
  lastUserId: number;
  lastRoomId: number;

  constructor() {
    this.users = new Map<number, IUser>();
    this.rooms = new Map<number, IUser>();
    this.lastUserId = 0;
    this.lastRoomId = 0;
  }

  public setUser(key: number, value: IUser) {
    this.users.set(key, value);
  }

  public getUser(key: number) {
    return this.users.get(key);
  }

  public getUserId() {
    this.lastUserId += 1;
    return this.lastUserId;
  }
}

export default new InMemoryDatabase();
