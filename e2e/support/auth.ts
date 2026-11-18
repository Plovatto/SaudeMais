import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';
import { SESSION_STORAGE_KEY } from '../../src/lib/auth/token-store';
import { WEB_ORIGIN } from './env';

export type ExampleRole = 'patient' | 'doctor';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

const AUTH_DIR = path.join(import.meta.dirname, '..', '.auth');

export const storageStateFor = (role: ExampleRole) => path.join(AUTH_DIR, `${role}.json`);

export async function saveSession(role: ExampleRole, token: string) {
  const state: StorageState = {
    cookies: [],
    origins: [{ origin: WEB_ORIGIN, localStorage: [{ name: SESSION_STORAGE_KEY, value: token }] }],
  };
  await mkdir(AUTH_DIR, { recursive: true });
  await writeFile(storageStateFor(role), JSON.stringify(state));
}

export async function tokenFor(role: ExampleRole) {
  const state = JSON.parse(await readFile(storageStateFor(role), 'utf8')) as StorageState;
  const token = state.origins[0]?.localStorage[0]?.value;
  if (!token) throw new Error(`No saved session for ${role}`);
  return token;
}
