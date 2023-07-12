import { FIELD_SIDE_SIZE } from '../constants.js';

export const getCoordsAroundShip = (arr: string[], main: number, dir: 'h' | 'v') => {
  let result: string[] = [];
  const first = Number(arr[0]);
  const last = Number(arr[arr.length - 1]);

  switch (dir) {
    case 'h':
      arr.map((e, i) => {
        result.push(`${e}-${+main + 1}`);
        result.push(`${e}-${+main - 1}`);
        if (i === 0 && first > 0) {
          result.push(`${+e - 1}-${+main - 1}`);
          result.push(`${+e - 1}-${+main}`);
          result.push(`${+e - 1}-${+main + 1}`);
          if (first === last) {
            result.push(`${+e + 1}-${+main - 1}`);
            result.push(`${+e + 1}-${+main}`);
            result.push(`${+e + 1}-${+main + 1}`);
          }
        } else if (i === arr.length - 1 && +last + 1 < FIELD_SIDE_SIZE) {
          result.push(`${+e + 1}-${+main - 1}`);
          result.push(`${+e + 1}-${+main}`);
          result.push(`${+e + 1}-${+main + 1}`);
        }
      });
      break;

    case 'v':
      arr.map((e, i) => {
        result.push(`${+main + 1}-${e}`);
        result.push(`${main - 1}-${e}`);
        if (i === 0 && first > 0) {
          result.push(`${main - 1}-${+e - 1}`);
          result.push(`${main}-${+e - 1}`);
          result.push(`${+main + 1}-${+e - 1}`);
          if (first === last) {
            result.push(`${main - 1}-${+e + 1}`);
            result.push(`${main}-${+e + 1}`);
            result.push(`${+main + 1}-${+e + 1}`);
          }
        } else if (i === arr.length - 1 && +last + 1 < FIELD_SIDE_SIZE) {
          result.push(`${main - 1}-${+e + 1}`);
          result.push(`${main}-${+e + 1}`);
          result.push(`${+main + 1}-${+e + 1}`);
        }
      });

      break;
  }

  return result;
};

// const ship = ['1-1', '2-1', '3-1', '4-1'];

// const coords = getCoordsAroundShip(ship, 0, 'h');

// console.log(coords);
