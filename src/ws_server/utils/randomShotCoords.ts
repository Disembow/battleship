export const randomShotCoords = (min: number, max: number) => {
  const x = Math.sqrt(Math.pow(Math.round(min - 0.5 + Math.random() * (max - min)), 2));
  const y = Math.sqrt(Math.pow(Math.round(min - 0.5 + Math.random() * (max - min)), 2));

  return [x, y];
};
