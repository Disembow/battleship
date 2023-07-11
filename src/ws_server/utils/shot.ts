enum ShotResult {
  Hit = 'hit',
  Miss = 'miss',
}

type TShips = Array<Array<string>>;

type TShot = (target: string, init: TShips, killed: TShips) => ShotResult;

export const shoot: TShot = (target, init, killed) => {
  let result = ShotResult.Miss;

  init.forEach((ship, shipIndex) => {
    ship.forEach((coord, coordIndex) => {
      if (coord === target) {
        killed[shipIndex][coordIndex] = target;
        result = ShotResult.Hit;
      }
    });
  });

  return result;
};
