import { WebSocket } from 'ws';
import { AttackStatus, TShipInfo, TShipsCoords, TWinners } from '../types/types.js';
import { Users } from './users.js';

interface IRoomDB {
  shot(target: string, init: TShipsCoords, killed: TShipsCoords): AttackStatus;
  createInitialShipState(arr: TShipInfo[]): TShipsCoords;
  getAllWinners(): TWinners[];
  updateWinner(name: string): void;
}

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

type TRoomUsers = {
  name: string;
  index: number;
};

type TRoomResponse = {
  roomId: number;
  roomUsers: TRoomUsers[];
};

export interface IRoom {
  usersWS: WebSocket[];
  roomUsers: TRoomUsers[];
}

class RoomsDB extends Users implements IRoomDB {
  private rooms;
  private games;
  private winners: TWinners[];
  private lastRoomId: number;
  private lastGameId: number;

  constructor() {
    super();
    // Each room contains websockets array of 1 or 2 players & their info
    this.rooms = new Map<number, IRoom>();
    // Each game contains an object with keys as userId & value as ship stat
    this.games = new Map<number, IGame>();
    this.winners = [];

    this.lastRoomId = 0;
    this.lastGameId = 0;
  }

  public setRoom(roomId: number, ws: WebSocket, name: string, index: number): void {
    this.rooms.set(roomId, {
      usersWS: [ws],
      roomUsers: [
        {
          name,
          index,
        },
      ],
    });
  }

  public getAllRooms() {
    const result: TRoomResponse[] = [];

    this.rooms.forEach((value, key) => {
      result.push({
        roomId: key,
        roomUsers: value.roomUsers,
      });
    });

    return result;
  }

  public getRoom(roomId: number): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomId(): number {
    this.lastRoomId += 1;
    return this.lastRoomId;
  }

  public setGame(gameId: number, gameState: IGame): void {
    this.games.set(gameId, gameState);
  }

  public findGameById(gameId: number): IGame | undefined {
    return this.games.get(gameId);
  }

  public getGameId(): number {
    this.lastGameId += 1;
    return this.lastGameId;
  }

  public selectFirstPlayerToTurn() {
    return Math.round(Math.random());
  }

  public shot(target: string, shipsCoords: TShipsCoords, killed: TShipsCoords) {
    let result = AttackStatus.Miss;

    shipsCoords.forEach((ship, shipIndex) => {
      ship.forEach((coord, coordIndex) => {
        if (coord === target) {
          killed[shipIndex][coordIndex] = target;
          result = AttackStatus.Shot;
        }

        shipsCoords.forEach((e, i) => {
          if (JSON.stringify(e) === JSON.stringify(killed[i])) {
            shipsCoords.splice(i, 1);
            killed.splice(i, 1);

            result = AttackStatus.Killed;
          }
        });
      });
    });

    return result;
  }

  public createInitialShipState(arr: TShipInfo[]) {
    const status: TShipsCoords = [];

    arr.map((ship) => {
      const { x, y } = ship.position;
      const { direction, length } = ship;
      const state: string[] = [];

      if (direction) {
        for (let i = 0; i < length; i++) {
          state.push(`${x}-${y + i}`);
        }
        status.push(state);
      } else {
        for (let i = 0; i < length; i++) {
          state.push(`${x + i}-${y}`);
        }
        status.push(state);
      }
    });

    return status;
  }

  public getAllWinners() {
    return this.winners;
  }

  public updateWinner(name: string) {
    const winner = this.winners.find((e) => e.name === name);

    if (winner) {
      winner.wins += 0.5;
    } else {
      this.setWinner(name, 0.5);
    }
  }

  private setWinner(name: string, wins: number = 0) {
    this.winners.push({
      name,
      wins,
    });
  }
}

export default new RoomsDB();
