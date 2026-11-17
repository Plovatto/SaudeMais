import { useSyncExternalStore } from 'react';
import { currentTheme, subscribeTheme, type Theme } from './theme';

export const useTheme = (): Theme => useSyncExternalStore(subscribeTheme, currentTheme, () => 'light');
