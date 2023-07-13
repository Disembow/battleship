import { WebSocket } from 'ws';

export enum Commands {
  AddShips = 'add_ships',
  AddUserToRoom = 'add_user_to_room',
  Attack = 'attack',
  CreateGame = 'create_game',
  CreateRoom = 'create_room',
  Finish = 'finish',
  RandomAttack = 'randomAttack',
  Reg = 'reg',
  SinglePlay = 'single_play',
  StartGame = 'start_game',
  Turn = 'turn',
  UpdateRoom = 'update_room',
  UpdateWinners = 'update_winners',
}

export interface IRegRequest {
  type: string;
  data: string;
}

export interface IRegRequestData {
  name: string;
  password: string;
}

export type AddUserToRoomReq = {
  indexRoom: number;
};

export type StartingFieldReq = {
  gameId: number;
  indexPlayer: number;
  ships: TShipInfo[];
};

export type Attack = Pick<StartingFieldReq, 'gameId' | 'indexPlayer'> & { x: number; y: number };

export enum AttackStatus {
  Killed = 'killed',
  Miss = 'miss',
  Shot = 'shot',
}

export enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

export type TShipsCoords = Array<Array<string>>;

export type TShipInfo = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: typeof ShipType;
};

export type TWinners = {
  name: string;
  wins: number;
};

export type TRoomUsers = {
  name: string;
  index: number;
};

export type TRoomResponse = {
  roomId: number;
  roomUsers: TRoomUsers[];
};

export interface IGame {
  [key: number]: {
    ships: TShipInfo[];
    shipsCoords: TShipsCoords;
    killed: TShipsCoords;
  };
  usersInGame: WebSocket[];
  ids: number[];
  turn: number;
}

export interface IRoom {
  usersWS: WebSocket[];
  roomUsers: TRoomUsers[];
}
