// type TRoomUser = {
//   name: string;
//   index: number;
// };

// interface IRoom {
//   roomId: number;
//   roomUsers: TRoomUser[];
// }

// interface IUser {
//   name: string;
//   password: string;
// }

// export const Rooms = new Map<number, IRoom>();

// export let Users = new Map<number, IUser>();

class DataBase {
  constructor() {
    this.data = {};
  }

  insert(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key];
  }

  delete(key) {
    delete this.data[key];
  }

  update(key, value) {
    if (key in this.data) {
      this.data[key] = value;
    }
  }
}

export default new DataBase();
