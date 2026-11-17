import { vi } from 'vitest';

export function stubMatchMedia(matches: (query: string) => boolean = () => false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
}
