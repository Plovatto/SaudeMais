export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

export const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', menuLabel: 'Tema claro' },
  { value: 'dark', label: 'Escuro', menuLabel: 'Tema escuro' },
  { value: 'system', label: 'Sistema', menuLabel: 'Tema do sistema' },
] as const satisfies readonly { value: ThemePreference; label: string; menuLabel: string }[];

export const THEME_STORAGE_KEY = 'saudemais:v1:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const preferenceListeners = new Set<() => void>();

let chosen: ThemePreference | undefined;
let persisted = true;

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getThemePreference(): ThemePreference {
  if (!persisted && chosen) return chosen;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return chosen ?? 'system';
  }
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== 'system') return preference;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function setThemePreference(preference: ThemePreference): void {
  chosen = preference;
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
    persisted = true;
  } catch {
    persisted = false;
  }
  applyTheme(resolveTheme(preference));
  for (const listener of preferenceListeners) listener();
}

export function subscribeThemePreference(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  return () => preferenceListeners.delete(onChange);
}

export function followSystemTheme(): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme(resolveTheme('system'));
  };
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
