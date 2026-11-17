import { useSyncExternalStore } from 'react';
import {
  currentTheme,
  getThemePreference,
  subscribeTheme,
  subscribeThemePreference,
  type Theme,
  type ThemePreference,
} from './theme';

export const useTheme = (): Theme => useSyncExternalStore(subscribeTheme, currentTheme, () => 'light');

export const useThemePreference = (): ThemePreference =>
  useSyncExternalStore(subscribeThemePreference, getThemePreference, () => 'system');
