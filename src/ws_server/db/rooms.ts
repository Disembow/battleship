import { WebSocket, WebSocketServer } from 'ws';
import { Commands, IGameState, IRoom, TRoomResponse, TWinners } from '../types/types.js';
import { UsersDB } from './users.js';

interface IRoomDB {
  setRoom(roomId: number, ws: WebSocket, name: string, index: number): void;
  createRoom(ws: WebSocket, wss: WebSocketServer): void;
  getAllRooms(): TRoomResponse[];
  getRoomById(roomId: number): IRoom | undefined;
  getRoomId(): number;
  updateRooms(): string;

  findGameById(gameId: number): IGameState | undefined;
  getGameId(): number;
  selectFirstPlayerToTurn(): number;

  getAllWinners(): TWinners[];
  updateWinner(name: string): void;
  setGame(gameId: number, gameState: IGameState): void;
}

export class RoomsDB extends UsersDB implements IRoomDB {
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
    this.games = new Map<number, IGameState>();
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

  public createRoom(ws: WebSocket, wss: WebSocketServer): void {
    const newRoomId = this.getRoomId();
    const name = this.db.get(ws)?.name;
    const index = this.db.get(ws)?.index;

    if (name && index) this.setRoom(newRoomId, ws, name, index);

    // Update rooms state
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(this.updateRooms());
      }
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

  public updateRooms(): string {
    return JSON.stringify({
      type: Commands.UpdateRoom,
      data: JSON.stringify(this.getAllRooms()),
    });
  }

  public deleteRoomById(id: number): void {
    this.rooms.delete(id);
  }

  public deleteRoomOnDisconnect(ws: WebSocket, wss: WebSocketServer) {
    for (let [key, value] of this.rooms.entries()) {
      value.usersWS.forEach((userWS) => {
        if (JSON.stringify(userWS) === JSON.stringify(ws)) {
          this.deleteRoomById(key);
        }
      });
    }

    wss.clients.forEach((client) => {
      client.send(this.updateRooms());
    });
  }

  public setGame(gameId: number, gameState: IGameState): void {
    this.games.set(gameId, gameState);
  }

  public findGameById(gameId: number): IGameState | undefined {
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
    const winner = this.winners.find((winner) => winner.name === name);

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
}
