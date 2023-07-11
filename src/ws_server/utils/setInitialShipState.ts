import { TShipInfo } from '../db/rooms.js';

type ISetState = (arr: TShipInfo[]) => TStringCoords;

export type TStringCoords = Array<Array<string>>;

export const setInitialShipState: ISetState = (arr) => {
  const status: TStringCoords = [];

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
};
