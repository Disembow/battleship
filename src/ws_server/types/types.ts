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

export interface IGame {
  [key: number]: {
    ships: TShipInfo[];
  };
  ws: WebSocket[];
  ids: number[];
  turn: number;
}

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
