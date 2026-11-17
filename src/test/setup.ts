import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { acknowledgeSessionExpiry } from '@lib/auth/session';
import { clearToken } from '@lib/auth/token-store';
import { stubMatchMedia } from './match-media';

configure({ asyncUtilTimeout: 3000 });

beforeEach(() => stubMatchMedia());

if (!('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
      this.querySelector<HTMLElement>('[autofocus], button, input, select, textarea, [href]')?.focus();
    },
    close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
}

afterEach(() => {
  cleanup();
  clearToken();
  acknowledgeSessionExpiry();
  vi.unstubAllGlobals();
});
