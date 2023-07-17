import { TShipsCoords } from '../types/types.js';

export const getEmptyArray = (size: number) => {
  const res: TShipsCoords = [];

  for (let i = 0; i < size; i++) {
    res.push([]);
  }

  return res;
};
