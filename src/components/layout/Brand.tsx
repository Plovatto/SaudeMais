import type { IconType } from 'react-icons';
import { APP_NAME } from './route-handle';

export function Brand({ icon: Icon, subtitle }: { icon: IconType; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-0.5">
      <span className="text-role-strong dark:bg-role dark:text-role-deep rounded-tile grid size-10 shrink-0 place-items-center bg-white shadow-[0_6px_16px_-6px_rgb(0_0_0/0.45),inset_0_-2px_0_rgb(0_0_0/0.06)]">
        <Icon aria-hidden className="size-[22px]" />
      </span>
      <div>
        <p className="text-lg leading-[1.15] font-bold tracking-[-0.02em]">{APP_NAME}</p>
        <p className="text-xs font-medium text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}
