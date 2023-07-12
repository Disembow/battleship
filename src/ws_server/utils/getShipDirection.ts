export const getShipDirection = (arr: string[]): 'v' | 'h' => {
  return arr
    .reduce((acc: number[], cur: string) => {
      return (acc = [...acc, +cur.split('-')[0]]);
    }, [])
    .every((e: number, i: number, a: number[]) => {
      return i === 0 ? true : e === a[i - 1];
    })
    ? 'v'
    : 'h';
};
