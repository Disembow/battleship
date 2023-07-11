import { WebSocket } from 'ws';
import { AttackStatus, IGame, TShipInfo, TShipsCoords } from '../types/types.js';

interface IRoomDB {
  shot(target: string, init: TShipsCoords, killed: TShipsCoords): AttackStatus;
  setInitialShipState(arr: TShipInfo[]): TShipsCoords;
}

class RoomsDB implements IRoomDB {
  private rooms;
  private games;
  private lastRoomId: number;
  private lastGameId: number;

  constructor() {
    // Each room contains an array of websockets
    this.rooms = new Map<number, WebSocket[]>();
    // Each game contains an object with keys as userId & value as ship stat
    this.games = new Map<number, IGame>();

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

  public changeTurnByRoomId(id: number) {}

  public shot(target: string, init: TShipsCoords, killed: TShipsCoords) {
    let result = AttackStatus.Miss;

    init.forEach((ship, shipIndex) => {
      ship.forEach((coord, coordIndex) => {
        if (coord === target) {
          killed[shipIndex][coordIndex] = target;
          result = AttackStatus.Shot;
        }

        init.forEach((e, i) => {
          if (JSON.stringify(e) === JSON.stringify(killed[i])) {
            init.splice(i, 1);
            killed.splice(i, 1);

            result = AttackStatus.Killed;
          }
        });
      });
    });

    return result;
  }

  public setInitialShipState(arr: TShipInfo[]) {
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
}

export default new RoomsDB();
