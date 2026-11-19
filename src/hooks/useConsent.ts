import { useSyncExternalStore } from 'react';
import { getConsent, subscribeConsent, type ConsentState } from '@lib/consent';

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, getConsent);
}
