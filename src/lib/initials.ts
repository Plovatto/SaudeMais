export function initials(fullName: string): string {
  const words = fullName
    .replace(/^(dra?\.)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  const picked = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1);
  return picked
    .map((word) => word?.[0] ?? '')
    .join('')
    .toUpperCase();
}

export function hueOf(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 6;
}
