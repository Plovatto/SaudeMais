import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/ }).refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.search === '' && url.hash === '';
  }),
});

export interface Env {
  apiUrl: string;
}

export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Invalid environment: VITE_API_URL must be an http or https URL without query or hash');
  }
  return { apiUrl: parsed.data.VITE_API_URL.replace(/\/+$/, '') };
}
