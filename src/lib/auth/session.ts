import { setTokenProvider } from '@lib/api/api-fetch';
import { clearToken, readToken, saveToken, SESSION_STORAGE_KEY } from './token-store';

const CHANNEL_NAME = 'saudemais:v1:session';
const SIGNED_OUT = 'signed-out';

export type SessionEndReason = 'signed-out' | 'expired';

type Listener = () => void;

const listeners = new Set<Listener>();
let endReason: SessionEndReason | null = null;

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);

function notify(): void {
  for (const listener of listeners) listener();
}

setTokenProvider(readToken);

channel?.addEventListener('message', (event: MessageEvent) => {
  if (event.data !== SIGNED_OUT) return;
  endReason = 'signed-out';
  clearToken();
  notify();
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return;
    if (readToken() === null) endReason = 'signed-out';
    notify();
  });
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const sessionToken = readToken;

export function sessionEndReason(): SessionEndReason | null {
  return endReason;
}

export function acknowledgeSessionExpiry(): void {
  if (endReason === 'expired') endReason = null;
}

export function startSession(token: string, remember: boolean): void {
  endReason = null;
  saveToken(token, remember);
  notify();
}

export function endSession(reason: SessionEndReason, failedToken?: string | null): void {
  const current = readToken();
  if (reason === 'expired' && (current === null || failedToken !== current)) return;
  endReason = reason;
  clearToken();
  if (reason === 'signed-out') channel?.postMessage(SIGNED_OUT);
  notify();
}
