import { LuLogOut, LuRepeat, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { Menu } from '@components/ui';
import type { Area } from '@constants/areas';
import { useThemeMenuItems } from './useThemeMenuItems';

export function AccountMenu({ area }: { area: Area }) {
  const navigate = useNavigate();
  const themeItems = useThemeMenuItems();
  const go = (to: string) => () => void navigate(to);
  return (
    <Menu
      label={`Menu da conta, ${area.label}`}
      icon={<area.icon />}
      align="start"
      triggerClassName="rounded-tile bg-role text-on-role can-hover:bg-role-strong [&_svg]:text-2xl"
      items={[
        { label: 'Meu perfil', icon: <LuUser />, onSelect: go(`${area.base}/perfil`) },
        { label: 'Trocar perfil', icon: <LuRepeat />, onSelect: go('/perfis') },
        ...themeItems,
        { label: 'Sair', icon: <LuLogOut />, tone: 'danger', onSelect: go('/login') },
      ]}
    />
  );
}
