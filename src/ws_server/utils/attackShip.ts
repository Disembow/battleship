import { Commands } from '../types/types.js';

export const attackShip = (x: number, y: number, indexPlayer: number, status: string) => {
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
};
