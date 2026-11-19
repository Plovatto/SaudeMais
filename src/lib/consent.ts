export type ConsentChoice = 'granted' | 'denied';

export interface ConsentState {
  choice: ConsentChoice | null;
  asking: boolean;
  requests: number;
}

export const CONSENT_STORAGE_KEY = 'saudemais:v1:consent';

const listeners = new Set<() => void>();
let state: ConsentState | undefined;

function readStored(): ConsentChoice | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  } catch {
    return null;
  }
}

function update(next: ConsentState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function getConsent(): ConsentState {
  if (!state) {
    const choice = readStored();
    state = { choice, asking: choice === null, requests: 0 };
  }
  return state;
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function decideConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    state = { ...getConsent(), choice, asking: false };
    listeners.forEach((listener) => listener());
    return;
  }
  update({ ...getConsent(), choice, asking: false });
}

export function reopenConsent(): void {
  const current = getConsent();
  update({ ...current, asking: true, requests: current.requests + 1 });
}

export function resetConsentForTests(): void {
  state = undefined;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return;
    const choice = readStored();
    const current = getConsent();
    if (choice === current.choice) return;
    update({ ...current, choice, asking: choice === null });
  });
}
