export interface Group<T> {
  key: string;
  items: T[];
}

export function groupConsecutive<T>(items: readonly T[], keyOf: (item: T) => string): Group<T>[] {
  const groups: Group<T>[] = [];
  for (const item of items) {
    const key = keyOf(item);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}
