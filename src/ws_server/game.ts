import { WebSocket, WebSocketServer } from 'ws';
import { RoomsDB } from './db/rooms.js';
import { Attack, AttackStatus, Commands, TShipInfo, TShipsCoords } from './types/types.js';
import { getCoordsAroundShip } from './utils/getCoordsAroundShip.js';

interface IGame {
  createGame(idGame: number, client: WebSocket): string;
  createInitialShipState(arr: TShipInfo[]): TShipsCoords;
  shot(target: string, init: TShipsCoords, killed: TShipsCoords): (AttackStatus | string[])[];
  makeShot(data: string, ws: WebSocket, wss: WebSocketServer): void;
}

class Game extends RoomsDB implements IGame {
  constructor() {
    super();
  }

  public createGame(idGame: number, client: WebSocket): string {
    return JSON.stringify({
      type: Commands.CreateGame,
      data: JSON.stringify({
        idGame,
        idPlayer: this.db.get(client)?.index,
      }),
    });
  }

  private attackShip(
    x: number | string,
    y: number | string,
    indexPlayer: number,
    status: string,
  ): string {
    return JSON.stringify({
      type: Commands.Attack,
      data: JSON.stringify({
        position: {
          x,
          y,
        },
        currentPlayer: indexPlayer,
        status,
      }),
    });
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

        shipsCoords.forEach((ship, i) => {
          if (JSON.stringify(ship) === JSON.stringify(killed[i])) {
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
      usersInGame.forEach((user) => {
        user.send(this.attackShip(x, y, indexPlayer, status));

        // shot around the ship
        if (status === AttackStatus.Killed) {
          const roundCoords = getCoordsAroundShip(killedShip);

          roundCoords.forEach((ship) => {
            const [xx, yy] = ship.split('-');

            usersInGame.forEach((client) => {
              client.send(this.attackShip(xx, yy, indexPlayer, AttackStatus.Miss));
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
            data: JSON.stringify({ winPlayer: indexPlayer }),
          });

          user.send(finishGame);

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
          user.send(nextTurn);
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

export default new Game();
