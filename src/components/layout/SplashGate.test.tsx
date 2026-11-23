import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_TOKEN, testUser } from '@/test/render-app';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { createQueryClient } from '@lib/query-client';
import { queryKeys } from '@lib/query-keys';

async function mountGate(sessionReady: boolean) {
  vi.resetModules();
  const { SplashGate } = await import('./SplashGate');
  sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
  const queryClient = createQueryClient();
  if (sessionReady) queryClient.setQueryData(queryKeys.session, testUser());
  return render(
    <QueryClientProvider client={queryClient}>
      <SplashGate>
        <button type="button">Entrar</button>
      </SplashGate>
    </QueryClientProvider>,
  );
}

const appRoot = () =>
  screen.getByRole('button', { name: 'Entrar', hidden: true }).parentElement as HTMLElement;

describe('SplashGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('leaves the app reachable by keyboard and screen readers when the session is ready', async () => {
    await mountGate(true);

    expect(appRoot()).not.toHaveAttribute('inert');
    expect(appRoot()).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeVisible();
    expect(screen.queryByRole('status', { name: 'Carregando' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-splash-layer]')).toBeInTheDocument();
  });

  it('starts leaving as soon as a ready user presses a key, so focus never sits behind it', async () => {
    await mountGate(true);

    expect(document.querySelector('[data-splash-layer]')).toHaveAttribute('aria-hidden', 'true');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    });

    expect(document.querySelector('[data-splash-layer]')).toHaveClass('pointer-events-none');
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(document.querySelector('[data-splash-layer]')).not.toBeInTheDocument();
  });

  it('keeps the app inert and hidden only while the session is still loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    await mountGate(false);

    expect(appRoot()).toHaveAttribute('inert');
    expect(appRoot()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });

  it('removes the splash after playing it', async () => {
    await mountGate(true);

    await act(() => vi.advanceTimersByTimeAsync(3000));
    await act(() => vi.advanceTimersByTimeAsync(600));

    expect(document.querySelector('[data-splash-layer]')).not.toBeInTheDocument();
  });
});
