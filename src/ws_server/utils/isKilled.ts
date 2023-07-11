import { TStringCoords } from './setInitialShipState.js';

export const isKilled = (init: TStringCoords, final: TStringCoords) => {
  init.forEach((e, i) => {
    if (JSON.stringify(e) === JSON.stringify(final[i])) {
      init.splice(i, 1);
      final.splice(i, 1);
    }
  });
};
