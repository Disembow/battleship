import { AttackStatus } from '../types/types.js';

type TShips = Array<Array<string>>;

type TShot = (target: string, init: TShips, killed: TShips) => AttackStatus;

export const shoot: TShot = (target, init, killed) => {
  let result = AttackStatus.Miss;

  init.forEach((ship, shipIndex) => {
    ship.forEach((coord, coordIndex) => {
      if (coord === target) {
        killed[shipIndex][coordIndex] = target;
        result = AttackStatus.Shot;
      }

      init.forEach((e, i) => {
        if (JSON.stringify(e) === JSON.stringify(killed[i])) {
          init.splice(i, 1);
          killed.splice(i, 1);

          result = AttackStatus.Killed;
        }
      });
    });
  });

  return result;
};
