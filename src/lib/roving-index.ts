const keys = {
  horizontal: { next: 'ArrowRight', previous: 'ArrowLeft' },
  vertical: { next: 'ArrowDown', previous: 'ArrowUp' },
};

export function rovingIndex(
  key: string,
  current: number,
  count: number,
  orientation: keyof typeof keys,
): number | undefined {
  const last = count - 1;
  const { next, previous } = keys[orientation];
  if (key === next) return current >= last ? 0 : current + 1;
  if (key === previous) return current <= 0 ? last : current - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  return undefined;
}
