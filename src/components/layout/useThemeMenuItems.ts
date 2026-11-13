import { createElement, useState } from 'react';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';
import type { MenuItem } from '@components/ui';
import { getThemePreference, setThemePreference, type ThemePreference } from '@lib/theme';

const options = [
  { value: 'light', label: 'Tema claro', icon: LuSun },
  { value: 'dark', label: 'Tema escuro', icon: LuMoon },
  { value: 'system', label: 'Tema do sistema', icon: LuMonitor },
] as const satisfies readonly { value: ThemePreference; label: string; icon: unknown }[];

export function useThemeMenuItems(): MenuItem[] {
  const [preference, setPreference] = useState(getThemePreference);
  return options.map(({ value, label, icon }) => ({
    label,
    icon: createElement(icon),
    checked: preference === value,
    onSelect: () => {
      setThemePreference(value);
      setPreference(value);
    },
  }));
}
