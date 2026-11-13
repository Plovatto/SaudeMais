import { LuLogOut, LuRepeat, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useSession } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { Menu } from '@components/ui';
import type { Area } from '@constants/areas';
import { useThemeMenuItems } from './useThemeMenuItems';

export function AccountMenu({ area }: { area: Area }) {
  const navigate = useNavigate();
  const themeItems = useThemeMenuItems();
  const signOut = useSignOut();
  const session = useSession();
  const canSwitch = session.status === 'authenticated' && session.user.roles.length > 1;
  const go = (to: string) => () => void navigate(to);
  return (
    <Menu
      label={`Menu da conta, ${area.label}`}
      icon={<area.icon />}
      align="start"
      triggerClassName="rounded-tile bg-role-strong text-on-role can-hover:bg-role-strong/90 [&_svg]:text-2xl"
      items={[
        { label: 'Meu perfil', icon: <LuUser />, onSelect: go(`${area.base}/perfil`) },
        ...(canSwitch ? [{ label: 'Trocar perfil', icon: <LuRepeat />, onSelect: go('/perfis') }] : []),
        ...themeItems,
        { label: 'Sair', icon: <LuLogOut />, tone: 'danger', onSelect: () => void signOut() },
      ]}
    />
  );
}
