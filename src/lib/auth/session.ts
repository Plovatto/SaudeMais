import { setTokenProvider } from '@lib/api/api-fetch';
import { clearToken, readToken, saveToken } from './token-store';

const CHANNEL_NAME = 'saudemais:v1:session';
const SIGNED_OUT = 'signed-out';

type Listener = () => void;

const listeners = new Set<Listener>();
let expired = false;

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);

function notify(): void {
  for (const listener of listeners) listener();
}

setTokenProvider(readToken);

channel?.addEventListener('message', (event: MessageEvent) => {
  if (event.data !== SIGNED_OUT) return;
  expired = false;
  clearToken();
  notify();
});

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const sessionToken = readToken;

export function sessionExpired(): boolean {
  return expired;
}

export function acknowledgeSessionExpiry(): void {
  expired = false;
}

export function startSession(token: string, remember: boolean): void {
  expired = false;
  saveToken(token, remember);
  notify();
}

export function endSession(reason: 'signed-out' | 'expired'): void {
  if (reason === 'expired' && readToken() === null) return;
  expired = reason === 'expired';
  clearToken();
  if (reason === 'signed-out') channel?.postMessage(SIGNED_OUT);
  notify();
}
