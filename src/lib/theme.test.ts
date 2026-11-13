import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import themeInit from '../../public/theme-init.js?raw';
import {
  applyTheme,
  followSystemTheme,
  getThemePreference,
  resolveTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
} from './theme';

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: dark && query.includes('dark'), media: query })),
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getThemePreference', () => {
  it('follows the system when nothing was chosen', () => {
    expect(getThemePreference()).toBe('system');
  });

  it('returns the stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getThemePreference()).toBe('dark');
  });

  it('ignores invalid values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(getThemePreference()).toBe('system');
  });

  it('falls back to the system when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getThemePreference()).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('uses the system setting for "system"', () => {
    mockSystemDark(true);
    expect(resolveTheme('system')).toBe('dark');
    mockSystemDark(false);
    expect(resolveTheme('system')).toBe('light');
  });

  it('keeps an explicit choice regardless of the system', () => {
    mockSystemDark(true);
    expect(resolveTheme('light')).toBe('light');
  });
});

describe('applyTheme and setThemePreference', () => {
  it('sets the theme on the root element and the color scheme for native controls', () => {
    applyTheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('stores the choice and applies it', () => {
    setThemePreference('light');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('forgets the stored choice when going back to the system', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    setThemePreference('system');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('still applies the theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    setThemePreference('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('followSystemTheme', () => {
  function mockChangingSystem() {
    let listener: () => void = () => undefined;
    let dark = false;
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: dark && query.includes('dark'),
        addEventListener: (_type: string, callback: () => void) => (listener = callback),
        removeEventListener: vi.fn(),
      })),
    );
    return (value: boolean) => {
      dark = value;
      listener();
    };
  }

  it('updates the page when the system theme changes and the preference is "system"', () => {
    const setSystemDark = mockChangingSystem();
    followSystemTheme();

    setSystemDark(true);

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('keeps an explicit choice when the system theme changes', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const setSystemDark = mockChangingSystem();
    followSystemTheme();

    setSystemDark(true);

    expect(document.documentElement.dataset.theme).not.toBe('dark');
  });
});

describe('theme-init script', () => {
  it.each([
    ['dark', false],
    ['light', true],
    ['purple', true],
    [null, true],
    [null, false],
  ])(
    'applies the same theme as the app before it loads (stored %s, system dark %s)',
    (stored, systemDark) => {
      if (stored) localStorage.setItem(THEME_STORAGE_KEY, stored);
      mockSystemDark(systemDark);

      // eslint-disable-next-line @typescript-eslint/no-implied-eval -- runs the real pre-paint script
      const runThemeInit = new Function('document', 'localStorage', 'matchMedia', themeInit) as (
        ...globals: unknown[]
      ) => void;
      runThemeInit(document, localStorage, (query: string) => window.matchMedia(query));

      expect(document.documentElement.dataset.theme).toBe(resolveTheme(getThemePreference()));
    },
  );
});
