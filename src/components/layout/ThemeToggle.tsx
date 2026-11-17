import { LuMoon, LuSun } from 'react-icons/lu';
import { IconButton } from '@components/ui';
import { setThemePreference } from '@lib/theme';
import { useTheme } from '@lib/useTheme';

export function ThemeToggle() {
  const dark = useTheme() === 'dark';
  return (
    <IconButton
      label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      icon={dark ? <LuSun /> : <LuMoon />}
      onClick={() => setThemePreference(dark ? 'light' : 'dark')}
    />
  );
}
