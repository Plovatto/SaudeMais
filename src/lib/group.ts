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

export function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
