import WebSocket from 'ws';
import { Commands } from '../types/types.js';
import UsersDB from '../db/users.js';

export const createGame = (idGame: number, client: WebSocket): string => {
  return JSON.stringify({
    type: Commands.CreateGame,
    data: JSON.stringify({
      idGame,
      idPlayer: UsersDB.db.get(client)?.index,
    }),
  });
};
