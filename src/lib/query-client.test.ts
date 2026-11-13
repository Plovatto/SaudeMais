import { describe, expect, it } from 'vitest';
import { ApiError } from '@lib/api/api-error';
import { createQueryClient, shouldRetry } from './query-client';

describe('query retry policy', () => {
  it('retries a timeout only once, so a slow server does not keep the screen waiting', () => {
    const timeout = new ApiError(0, 'TIMEOUT', '');

    expect(shouldRetry(0, timeout)).toBe(true);
    expect(shouldRetry(1, timeout)).toBe(false);
  });

  it.each([
    ['a network failure', new ApiError(0, 'NETWORK_ERROR', '')],
    ['a server error', new ApiError(503, 'SERVER_BUSY', '')],
  ])('retries %s up to twice', (_case, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });

  it.each([
    ['a client error', new ApiError(404, 'ROUTE_NOT_FOUND', '')],
    ['an expired session', new ApiError(401, 'UNAUTHENTICATED', '')],
    ['an unexpected error', new Error('boom')],
  ])('does not retry %s', (_case, error) => {
    expect(shouldRetry(0, error)).toBe(false);
  });

  it('never retries mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
