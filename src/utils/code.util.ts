export const createItemCode = (prefix: string): string => {
  const randNumber = Math.floor(100 + Math.random() * 900);
  return `${prefix}.${randNumber}`;
};

export const createUnitCode = (code: string, i: number): string => {
  return `${code}.${i}`;
};
