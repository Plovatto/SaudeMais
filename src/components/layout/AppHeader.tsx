import { LuBell, LuBellOff } from 'react-icons/lu';
import { EmptyState, Popover } from '@components/ui';
import type { Area } from '@constants/areas';
import { AccountMenu } from './AccountMenu';
import { layoutWidth } from './MainContent';
import { APP_NAME } from './route-handle';

export function AppHeader({ area }: { area: Area }) {
  return (
    <header className="border-border bg-surface shadow-button sticky top-0 z-30 border-b">
      <div className={`${layoutWidth} flex h-[75px] items-center gap-3 px-4 lg:px-6`}>
        <AccountMenu area={area} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-text-secondary truncate text-base font-bold">{area.label}</span>
          <span className="text-text-muted truncate text-xs font-medium">{APP_NAME}</span>
        </div>
        <Popover label="Notificações" title="Notificações" icon={<LuBell />}>
          <EmptyState icon={<LuBellOff />} title="Nenhuma notificação" className="py-4" />
        </Popover>
      </div>
    </header>
  );
}
