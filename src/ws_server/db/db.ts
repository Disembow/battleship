interface IDataBase {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  };
}

interface IUser {
  name: string;
  password: string;
}

export const Rooms = new Map<number, IDataBase>();

export const Users = new Map<number, IUser>();
