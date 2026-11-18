import type { Area } from '@constants/areas';
import { cx } from '@lib/cx';

export function RoleLogo({ area, className }: { area: Area; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid size-11 shrink-0 place-items-center rounded-[13px] text-white',
        area.role === 'admin'
          ? 'bg-role-strong shadow-[0_6px_14px_-8px_var(--role-strong)]'
          : 'bg-role shadow-[0_6px_14px_-8px_var(--role)]',
        className,
      )}
    >
      <area.icon className="size-[22px]" />
    </span>
  );
}
