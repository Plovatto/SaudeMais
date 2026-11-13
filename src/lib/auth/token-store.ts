export const SESSION_STORAGE_KEY = 'saudemais:v1:session';

let memoryToken: string | null = null;

function attempt<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}

export function readToken(): string | null {
  return (
    attempt(() => sessionStorage.getItem(SESSION_STORAGE_KEY), null) ??
    attempt(() => localStorage.getItem(SESSION_STORAGE_KEY), null) ??
    memoryToken
  );
}

export function clearToken(): void {
  memoryToken = null;
  attempt(() => sessionStorage.removeItem(SESSION_STORAGE_KEY), undefined);
  attempt(() => localStorage.removeItem(SESSION_STORAGE_KEY), undefined);
}

export function saveToken(token: string, remember: boolean): void {
  clearToken();
  const storage = attempt(() => (remember ? localStorage : sessionStorage), null);
  const stored = attempt(() => {
    storage?.setItem(SESSION_STORAGE_KEY, token);
    return storage?.getItem(SESSION_STORAGE_KEY) === token;
  }, false);
  if (!stored) memoryToken = token;
}
