import { FIELD_SIDE_SIZE } from '../data/constants.js';
import { getShipDirection } from './getShipDirection.js';

export const getCoordsAroundShip = (killedShip: string[]) => {
  let result: string[] = [];
  const direction = getShipDirection(killedShip);
  const mainAxis = direction === 'h' ? +killedShip[0].split('-')[1] : +killedShip[0].split('-')[0];

  let line: string[] = [];
  killedShip.map((coords) => {
    const [a, b] = coords.split('-');
    if (direction === 'h') {
      line.push(a);
    } else {
      line.push(b);
    }
  });

  const first = Number(line[0]);
  const last = Number(line[line.length - 1]);

  switch (direction) {
    case 'h':
      line.map((e, i) => {
        result.push(`${e}-${+mainAxis + 1}`);
        result.push(`${e}-${+mainAxis - 1}`);
        if (i === 0 && first > 0) {
          result.push(`${+e - 1}-${+mainAxis - 1}`);
          result.push(`${+e - 1}-${+mainAxis}`);
          result.push(`${+e - 1}-${+mainAxis + 1}`);
          if (first === last) {
            result.push(`${+e + 1}-${+mainAxis - 1}`);
            result.push(`${+e + 1}-${+mainAxis}`);
            result.push(`${+e + 1}-${+mainAxis + 1}`);
          }
        } else if (i === line.length - 1 && +last + 1 < FIELD_SIDE_SIZE) {
          result.push(`${+e + 1}-${+mainAxis - 1}`);
          result.push(`${+e + 1}-${+mainAxis}`);
          result.push(`${+e + 1}-${+mainAxis + 1}`);
        }
      });
      break;

    case 'v':
      line.map((e, i) => {
        result.push(`${+mainAxis + 1}-${e}`);
        result.push(`${mainAxis - 1}-${e}`);
        if (i === 0 && first > 0) {
          result.push(`${mainAxis - 1}-${+e - 1}`);
          result.push(`${mainAxis}-${+e - 1}`);
          result.push(`${+mainAxis + 1}-${+e - 1}`);
          if (first === last) {
            result.push(`${mainAxis - 1}-${+e + 1}`);
            result.push(`${mainAxis}-${+e + 1}`);
            result.push(`${+mainAxis + 1}-${+e + 1}`);
          }
        } else if (i === line.length - 1 && +last + 1 < FIELD_SIDE_SIZE) {
          result.push(`${mainAxis - 1}-${+e + 1}`);
          result.push(`${mainAxis}-${+e + 1}`);
          result.push(`${+mainAxis + 1}-${+e + 1}`);
        }
      });

      break;
  }

  return result;
};
