import { TStringCoords } from './setInitialShipState.js';

export const isKilled = (init: TStringCoords, final: TStringCoords) => {
  let result: [number, string[]] | null = null;

  init.forEach((e, i) => {
    if (JSON.stringify(e) === JSON.stringify(final[i])) {
      result = [i, e];
    }
  });

  // remove ships after it was killed
  if (result !== null) {
    const [index, _] = result as [number, string[]];

    init.splice(index, 1);
    final.splice(index, 1);
  }

  return result;
};
