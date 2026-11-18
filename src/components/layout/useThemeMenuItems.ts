import { createElement } from 'react';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';
import type { MenuItem } from '@components/ui';
import { setThemePreference, THEME_OPTIONS, type ThemePreference } from '@lib/theme';
import { useThemePreference } from '@lib/useTheme';

const icons = { light: LuSun, dark: LuMoon, system: LuMonitor } satisfies Record<ThemePreference, unknown>;

export function useThemeMenuItems(): MenuItem[] {
  const preference = useThemePreference();
  return THEME_OPTIONS.map(({ value, menuLabel }) => ({
    label: menuLabel,
    icon: createElement(icons[value]),
    checked: preference === value,
    group: 'Tema',
    onSelect: () => setThemePreference(value),
  }));
}
