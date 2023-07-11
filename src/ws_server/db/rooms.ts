import { WebSocket } from 'ws';
import { AttackStatus, TShipInfo, TShipsCoords } from '../types/types.js';
import { Users } from './users.js';

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

interface IRoomDB {
  shot(target: string, init: TShipsCoords, killed: TShipsCoords): AttackStatus;
  createInitialShipState(arr: TShipInfo[]): TShipsCoords;
  getAllWinners(): TWinners[];
  updateWinner(name: string): void;
}

type TWinners = {
  name: string;
  wins: number;
};

class RoomsDB extends Users implements IRoomDB {
  private rooms;
  private games;
  private winners: TWinners[];
  private lastRoomId: number;
  private lastGameId: number;

  constructor() {
    super();
    // Each room contains an array of websockets
    this.rooms = new Map<number, WebSocket[]>();
    // Each game contains an object with keys as userId & value as ship stat
    this.games = new Map<number, IGame>();
    this.winners = [];

    this.lastRoomId = 0;
    this.lastGameId = 0;
  }

  public setRoom(roomId: number, value: WebSocket): void {
    this.rooms.set(roomId, [value]);
  }

  public getRoom(roomId: number): WebSocket[] | undefined {
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
