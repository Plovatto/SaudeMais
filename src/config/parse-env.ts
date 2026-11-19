import { z } from 'zod';
import { CLARITY_ID_FORMAT, GA_ID_FORMAT, validId } from './analytics-ids';

const envSchema = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/ }).refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.search === '' && url.hash === '';
  }),
  VITE_GA_ID: z.string().optional(),
  VITE_CLARITY_ID: z.string().optional(),
});

export interface AnalyticsEnv {
  ga: boolean;
  clarity: boolean;
}

export interface Env {
  apiUrl: string;
  analytics: AnalyticsEnv;
}

export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Invalid environment: VITE_API_URL must be an http or https URL without query or hash');
  }
  return {
    apiUrl: parsed.data.VITE_API_URL.replace(/\/+$/, ''),
    analytics: {
      ga: validId(parsed.data.VITE_GA_ID, GA_ID_FORMAT) !== null,
      clarity: validId(parsed.data.VITE_CLARITY_ID, CLARITY_ID_FORMAT) !== null,
    },
  };
}
