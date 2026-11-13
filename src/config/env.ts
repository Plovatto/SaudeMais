import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/ }),
});

export interface Env {
  apiUrl: string;
}

export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Invalid environment: VITE_API_URL must be an http or https URL');
  }
  return { apiUrl: parsed.data.VITE_API_URL.replace(/\/+$/, '') };
}

export const env = parseEnv(import.meta.env);
