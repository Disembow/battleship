export enum Commands {
  AddShips = 'add_ships',
  AddUserToRoom = 'add_user_to_room',
  Attack = 'attack',
  CreateGame = 'create_game',
  CreateRoom = 'create_room',
  Finish = 'finish',
  RandomAttack = 'randomAttack',
  Reg = 'reg',
  StartGame = 'start_game',
  Turn = 'turn',
  UpdateRoom = 'update_room',
  UpdateWinners = 'update_winners',
}

export interface IRegRequest {
  type: string;
  data: string;
  id: 0;
}

export interface IRegRequestData {
  name: string;
  password: string;
}
