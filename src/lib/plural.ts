export const pluralWord = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const plural = (count: number, one: string, many: string) =>
  `${count} ${pluralWord(count, one, many)}`;
