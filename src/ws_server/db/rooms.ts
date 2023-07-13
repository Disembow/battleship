import { WebSocket, WebSocketServer } from 'ws';
import {
  Attack,
  AttackStatus,
  Commands,
  IGame,
  IRoom,
  TRoomResponse,
  TShipInfo,
  TShipsCoords,
  TWinners,
} from '../types/types.js';
import { Users } from './users.js';
import { getShipDirection } from '../utils/getShipDirection.js';
import { getCoordsAroundShip } from '../utils/getCoordsAroundShip.js';
import { attackShip } from '../utils/attackShip.js';
import { IncomingMessage } from 'http';

interface IRoomDB {
  setRoom(roomId: number, ws: WebSocket, name: string, index: number): void;
  getAllRooms(): TRoomResponse[];
  getRoomById(roomId: number): IRoom | undefined;
  getRoomId(): number;

  findGameById(gameId: number): IGame | undefined;
  getGameId(): number;
  selectFirstPlayerToTurn(): number;

  getAllWinners(): TWinners[];
  updateWinner(name: string): void;
  setGame(gameId: number, gameState: IGame): void;

  shot(target: string, init: TShipsCoords, killed: TShipsCoords): (AttackStatus | string[])[];
  createInitialShipState(arr: TShipInfo[]): TShipsCoords;
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

  public getAllRooms(): TRoomResponse[] {
    const result: TRoomResponse[] = [];

    this.rooms.forEach((value, key) => {
      result.push({
        roomId: key,
        roomUsers: value.roomUsers,
      });
    });

    return result;
  }

  public getRoomById(roomId: number): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomId(): number {
    this.lastRoomId += 1;
    return this.lastRoomId;
  }

  public deleteRoomById(id: number): void {
    this.rooms.delete(id);
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

  public selectFirstPlayerToTurn(): number {
    return Math.round(Math.random());
  }

  public shot(
    target: string,
    shipsCoords: TShipsCoords,
    killed: TShipsCoords,
  ): (AttackStatus | string[])[] {
    let result = [AttackStatus.Miss, ['']];

    shipsCoords.forEach((ship, shipIndex) => {
      ship.forEach((coord, coordIndex) => {
        if (coord === target) {
          killed[shipIndex][coordIndex] = target;
          result = [AttackStatus.Shot, ['']];
        }

        shipsCoords.forEach((e, i) => {
          if (JSON.stringify(e) === JSON.stringify(killed[i])) {
            const killedShip = killed[i];

            shipsCoords.splice(i, 1);
            killed.splice(i, 1);

            result = [AttackStatus.Killed, killedShip];
          }
        });
      });
    });

    return result;
  }

  public makeShot(data: string, ws: WebSocket, wss: WebSocketServer) {
    const { gameId, x, y, indexPlayer } = <Attack>JSON.parse(data);
    const game = this.findGameById(gameId)!;
    const { ids, turn, usersInGame } = game;

    const secondPlayerId = ids[ids.indexOf(indexPlayer) === 0 ? 1 : 0];
    const shipsCoords = game[secondPlayerId].shipsCoords;
    const killedCoords = game[secondPlayerId].killed;

    // send attack response
    const [status, killedShip] = this.shot(`${x}-${y}`, shipsCoords, killedCoords) as [
      AttackStatus,
      string[],
    ];

    if (turn === indexPlayer) {
      usersInGame.forEach((e) => {
        e.send(attackShip(x, y, indexPlayer, status));

        // shot around the ship
        if (status === AttackStatus.Killed) {
          const roundCoords = getCoordsAroundShip(killedShip);

          roundCoords.forEach((ship) => {
            const [xx, yy] = ship.split('-');

            usersInGame.forEach((client) => {
              client.send(attackShip(xx, yy, indexPlayer, AttackStatus.Miss));
            });
          });
        }

        // send next turn
        let nextTurn;
        if (status === AttackStatus.Miss) {
          nextTurn = JSON.stringify({
            type: Commands.Turn,
            data: JSON.stringify({
              currentPlayer: secondPlayerId,
            }),
          });

          game.turn = secondPlayerId;
        } else {
          nextTurn = JSON.stringify({
            type: Commands.Turn,
            data: JSON.stringify({
              currentPlayer: indexPlayer,
            }),
          });
        }

        // win case
        //TODO check rooms state
        if (shipsCoords.length === 0) {
          const finishGame = JSON.stringify({
            type: Commands.Finish,
            data: JSON.stringify({
              winPlayer: indexPlayer,
            }),
          });

          e.send(finishGame);

          this.updateWinner(this.getUser(ws)!.name);

          const winners = JSON.stringify({
            type: Commands.UpdateWinners,
            data: JSON.stringify(this.getAllWinners()),
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(winners);
            }
          });
        } else {
          e.send(nextTurn);
        }
      });
    }
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
}

export default new RoomsDB();
