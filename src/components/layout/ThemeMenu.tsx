import { LuSunMoon } from 'react-icons/lu';
import { Menu } from '@components/ui';
import { useThemeMenuItems } from './useThemeMenuItems';

const onBrand =
  'text-white/80 can-hover:bg-white/10 can-hover:text-white aria-expanded:bg-white/15 aria-expanded:text-white';

export function ThemeMenu({ brand = false }: { brand?: boolean }) {
  const items = useThemeMenuItems();
  return (
    <Menu label="Tema" icon={<LuSunMoon />} items={items} {...(brand && { triggerClassName: onBrand })} />
  );
}
