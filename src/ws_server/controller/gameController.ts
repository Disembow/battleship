import { WebSocket, WebSocketServer } from 'ws';
import { RoomsDB } from '../db/rooms.js';
import {
  AddUserToRoomReq,
  Attack,
  AttackStatus,
  Commands,
  IGameState,
  IRegRequestData,
  StartingFieldReq,
  TShipInfo,
  TShipsCoords,
} from '../types/types.js';
import { getCoordsAroundShip } from '../utils/getCoordsAroundShip.js';
import { FIELD_SIDE_SIZE, USERS_PER_GAME } from '../data/constants.js';
import { getEmptyArray } from '../utils/getEmptyArray.js';
import { randomShotCoords } from '../utils/randomShotCoords.js';

interface IGame {
  createUser(data: string, ws: WebSocket, wss: WebSocketServer): void;
  addUserToRoom(data: string, ws: WebSocket, wss: WebSocketServer): void;
  makeShot(data: string, ws: WebSocket, wss: WebSocketServer): void;
  randomAttack(data: string, ws: WebSocket, wss: WebSocketServer): void;
}

export class GameController extends RoomsDB implements IGame {
  constructor() {
    super();
  }

  private createGameRes(idGame: number, client: WebSocket): string {
    return JSON.stringify({
      type: Commands.CreateGame,
      data: JSON.stringify({
        idGame,
        idPlayer: this.db.get(client)?.index,
      }),
    });
  }

  private createWinnersRes() {
    return JSON.stringify({
      type: Commands.UpdateWinners,
      data: JSON.stringify(this.getAllWinners()),
    });
  }

  private attackShipRes(
    x: number | string,
    y: number | string,
    indexPlayer: number,
    status: string,
  ): string {
    return JSON.stringify({
      type: Commands.Attack,
      data: JSON.stringify({
        position: { x, y },
        currentPlayer: indexPlayer,
        status,
      }),
    });
  }

  private nextTurnRes(id: number): string {
    return JSON.stringify({
      type: Commands.Turn,
      data: JSON.stringify({
        currentPlayer: id,
      }),
    });
  }

  private finishGameRes(indexPlayer: number) {
    return JSON.stringify({
      type: Commands.Finish,
      data: JSON.stringify({ winPlayer: indexPlayer }),
    });
  }

  public createUser(data: string, ws: WebSocket, wss: WebSocketServer): void {
    const { name, password } = <IRegRequestData>JSON.parse(data);

    const index = this.getUserId();
    this.setUser(ws, { index, name, password });

    const [error, errorText] = this.validateAuth(name, password, ws);

    const response = JSON.stringify({
      type: Commands.Reg,
      data: JSON.stringify({ name, index, error, errorText }),
    });

    ws.send(response);
    console.log(response);

    // Update rooms state
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const rooms = this.updateRooms();
        client.send(this.updateRooms());
        console.log(rooms);
      }
    });

    const winners = this.createWinnersRes();
    ws.send(winners);
    console.log(winners);
  }

  public addUserToRoom(data: string, ws: WebSocket, wss: WebSocketServer): void {
    const { indexRoom } = <AddUserToRoomReq>JSON.parse(data);
    const players = this.getRoomById(indexRoom);
    const isUserTargetRoomCreator = JSON.stringify(players?.usersWS[0]) === JSON.stringify(ws);

    if (!isUserTargetRoomCreator) players?.usersWS.push(ws);

    if (players?.usersWS.length === USERS_PER_GAME) {
      const idGame = this.getGameId();

      players.usersWS.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          const newGame = this.createGameRes(idGame, client);
          client.send(newGame);
          console.log(newGame);
        }
      });

      this.deleteRoomById(indexRoom);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          const rooms = this.updateRooms();
          client.send(rooms);
          console.log(rooms);
        }
      });
    }
  }

  public addShips(data: string, ws: WebSocket): void {
    const { gameId, indexPlayer, ships } = <StartingFieldReq>JSON.parse(data);
    const currentGame = this.findGameById(gameId);
    const shipsCoords = this.createInitialShipState(ships);
    const killed = getEmptyArray(FIELD_SIDE_SIZE);

    // Fill the initial game state on add_ships event
    if (!currentGame) {
      const newGame = { usersInGame: [ws], ids: [indexPlayer] } as IGameState;
      newGame[indexPlayer] = {
        ships,
        shipsCoords,
        killed,
      };
      this.setGame(gameId, newGame);
    } else {
      currentGame[indexPlayer] = {
        ships,
        shipsCoords,
        killed,
      };
      currentGame.usersInGame.push(ws);
      currentGame.ids.push(indexPlayer);
    }

    // Send message to players with their initial state & first turn
    if (currentGame?.usersInGame.length === USERS_PER_GAME) {
      const firstPlayer = this.selectFirstPlayerToTurn();

      currentGame.usersInGame.forEach((client) => {
        const userId = this.getUser(client)?.index!;

        const startState = JSON.stringify({
          type: Commands.StartGame,
          data: currentGame[userId].ships,
          currentPlayerIndex: userId,
        });

        client.send(startState);
        console.log(startState);

        currentGame.turn = currentGame.ids[firstPlayer];

        const turn = JSON.stringify({
          type: Commands.Turn,
          data: JSON.stringify({ currentPlayer: currentGame.turn }),
        });

        client.send(turn);
        console.log(turn);
      });
    }
  }

  private shot(
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

        if (JSON.stringify(ship) === JSON.stringify(killed[shipIndex]) && ship.includes(target)) {
          const killedShip = killed[shipIndex];
          result = [AttackStatus.Killed, killedShip];
        }
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

    // check is users connected
    usersInGame.forEach((client, index) => {
      if (client.readyState === WebSocket.CLOSED) {
        const user0 = usersInGame[0];
        const user1 = usersInGame[1];
        if (index === 0) {
          user1.send(this.nextTurnRes(ids[1]));
          user1.send(this.finishGameRes(ids[1]));
          console.log(this.nextTurnRes(ids[1]));
          console.log(this.finishGameRes(ids[1]));

          this.updateWinner(this.getUser(user1)!.name);
          user0.close();
        } else {
          user0.send(this.nextTurnRes(ids[0]));
          user0.send(this.finishGameRes(ids[0]));
          console.log(this.nextTurnRes(ids[0]));
          console.log(this.finishGameRes(ids[0]));
          this.updateWinner(this.getUser(user0)!.name);
          user1.close();
        }

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            const winners = this.createWinnersRes();
            client.send(winners);
            console.log(winners);
          }
        });
      }
    });

    // send attack response
    const [status, killedShip] = this.shot(`${x}-${y}`, shipsCoords, killedCoords) as [
      AttackStatus,
      string[],
    ];

    if (turn === indexPlayer) {
      usersInGame.forEach((user) => {
        const attack = this.attackShipRes(x, y, indexPlayer, status);
        user.send(attack);
        console.log(attack);

        // send shots around the killed ship
        if (status === AttackStatus.Killed) {
          const roundCoords = getCoordsAroundShip(killedShip);

          roundCoords.forEach((ship) => {
            const [xx, yy] = ship.split('-');

            usersInGame.forEach((client) => {
              const attackShip = this.attackShipRes(xx, yy, indexPlayer, AttackStatus.Miss);
              client.send(attackShip);
              console.log(attackShip);
            });
          });
        }

        //TODO check rooms state
        if (JSON.stringify(shipsCoords) === JSON.stringify(killedCoords)) {
          // win case
          const winRes = this.finishGameRes(indexPlayer);
          user.send(winRes);
          console.log(winRes);

          this.updateWinner(this.getUser(ws)!.name);

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              const winners = this.createWinnersRes();
              client.send(winners);
              console.log(winners);
            }
          });
        } else {
          // send next turn
          let nextTurn;
          if (status === AttackStatus.Miss) {
            nextTurn = this.nextTurnRes(secondPlayerId);
            game.turn = secondPlayerId;
          } else {
            nextTurn = this.nextTurnRes(indexPlayer);
          }

          user.send(nextTurn);
          console.log(nextTurn);
        }
      });
    }
  }

  public randomAttack(data: string, ws: WebSocket, wss: WebSocketServer): void {
    const { gameId, indexPlayer } = <Pick<StartingFieldReq, 'gameId' | 'indexPlayer'>>(
      JSON.parse(data)
    );
    const [x, y] = randomShotCoords(0, FIELD_SIDE_SIZE);
    const newData = JSON.stringify({ gameId, x, y, indexPlayer });
    this.makeShot(newData, ws, wss);
  }

  private createInitialShipState(arr: TShipInfo[]): TShipsCoords {
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

  public createSinglePlay(ws: WebSocket) {
    const { index, name } = this.getUser(ws)!;

    const idGame = this.getGameId();

    const newGame = this.createGameRes(idGame, ws);
    ws.send(newGame);
    console.log(newGame);

    // this.addShips();
  }
}
