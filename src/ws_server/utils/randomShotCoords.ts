export const randomShotCoords = (min: number, max: number) => {
  const random = () => Math.sqrt(Math.pow(Math.round(min - 0.5 + Math.random() * (max - min)), 2));

  const x = random();
  const y = random();

  return [x, y];
};
