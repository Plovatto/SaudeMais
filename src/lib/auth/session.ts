import { setTokenProvider } from '@lib/api/api-fetch';

let token: string | null = null;

setTokenProvider(() => token);

export function startSession(sessionToken: string): void {
  token = sessionToken;
}
