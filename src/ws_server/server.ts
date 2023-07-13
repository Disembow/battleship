import { WebSocket, WebSocketServer } from 'ws';
import {
  AddUserToRoomReq,
  Commands,
  IGame,
  IRegRequest,
  IRegRequestData,
  StartingFieldReq,
} from './types/types.js';
import Game from './game.js';
import { validateAuth } from './utils/validateAuth.js';
import { FIELD_SIDE_SIZE, USERS_PER_GAME } from './data/constants.js';
import { getEmptyArray } from './utils/getEmptyArray.js';
import { randomShotCoords } from './utils/randomShotCoords.js';

export const ws_server = (port: number) => {
  const wss = new WebSocketServer({ port }, () =>
    console.log(`Websocket server has been started on port ${port}...`),
  );

  wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', async (msg) => {
      const { type, data } = <IRegRequest>JSON.parse(msg.toString());

      switch (type) {
        case Commands.Reg: {
          const { name, password } = <IRegRequestData>JSON.parse(data);

          const index = Game.getUserId();
          Game.setUser(ws, { index, name, password });

          const [error, errorText] = validateAuth(name, password);

          const response = JSON.stringify({
            type: Commands.Reg,
            data: JSON.stringify({
              name,
              index,
              error,
              errorText,
            }),
          });

          ws.send(response);

          // Update rooms state
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(Game.updateRooms());
            }
          });
          break;
        }

        case Commands.CreateRoom: {
          const newRoomId = Game.getRoomId();
          const name = Game.db.get(ws)?.name;
          const index = Game.db.get(ws)?.index;

          if (name && index) Game.setRoom(newRoomId, ws, name, index);

          // Update rooms state
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(Game.updateRooms());
            }
          });
          break;
        }

        case Commands.AddUserToRoom: {
          const { indexRoom } = <AddUserToRoomReq>JSON.parse(data);
          const players = Game.getRoomById(indexRoom);
          players?.usersWS.push(ws);

          if (players?.usersWS.length === USERS_PER_GAME) {
            const idGame = Game.getGameId();

            players.usersWS.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(Game.createGame(idGame, client));
              }
            });

            Game.deleteRoomById(indexRoom);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(Game.updateRooms());
              }
            });
          }
          break;
        }

        case Commands.AddShips: {
          const { gameId, indexPlayer, ships } = <StartingFieldReq>JSON.parse(data);
          const game = Game.findGameById(gameId);
          const shipsCoords = Game.createInitialShipState(ships);
          const killed = getEmptyArray(FIELD_SIDE_SIZE);

          // Fill the initial game state on add_ships event
          if (!game) {
            const newGame = { usersInGame: [ws], ids: [indexPlayer] } as IGame;
            newGame[indexPlayer] = {
              ships,
              shipsCoords,
              killed,
            };
            Game.setGame(gameId, newGame);
          } else {
            game[indexPlayer] = {
              ships,
              shipsCoords,
              killed,
            };
            game.usersInGame.push(ws);
            game.ids.push(indexPlayer);
          }

          // Send message to players with their initial state & first turn
          if (game?.usersInGame.length === USERS_PER_GAME) {
            const firstPlayer = Game.selectFirstPlayerToTurn();

            game.usersInGame.forEach((client) => {
              const userId = Game.getUser(client)?.index!;

              const startState = JSON.stringify({
                type: Commands.StartGame,
                data: game[userId].ships,
                currentPlayerIndex: userId,
              });

              client.send(startState);

              game.turn = game.ids[firstPlayer];

              const turn = JSON.stringify({
                type: Commands.Turn,
                data: JSON.stringify({
                  currentPlayer: game.turn,
                }),
              });

              client.send(turn);
            });
          }
          break;
        }

        case Commands.Attack: {
          Game.makeShot(data, ws, wss);
          break;
        }

        case Commands.RandomAttack: {
          const { gameId, indexPlayer } = <Pick<StartingFieldReq, 'gameId' | 'indexPlayer'>>(
            JSON.parse(data)
          );
          const [x, y] = randomShotCoords(0, FIELD_SIDE_SIZE);
          const newData = JSON.stringify({ gameId, x, y, indexPlayer });
          Game.makeShot(newData, ws, wss);
          break;
        }
      }
    });
  });
};
