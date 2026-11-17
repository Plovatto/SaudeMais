import { cx } from '@lib/cx';
import { dayTile } from '@lib/date';

const sizes = {
  md: {
    box: 'w-[52px] rounded-tile',
    head: 'py-0.5 text-[0.65625rem]',
    day: 'pt-1.5 pb-[7px] text-[1.1875rem]',
  },
  lg: { box: 'w-[68px] rounded-[14px]', head: 'py-1 text-[0.71875rem]', day: 'pt-2 pb-2.5 text-[1.75rem]' },
};

export interface DateTileProps {
  startsAt: string;
  size?: keyof typeof sizes;
  muted?: boolean;
  className?: string;
}

export function DateTile({ startsAt, size = 'md', muted = false, className }: DateTileProps) {
  const { weekday, day } = dayTile(startsAt);
  const style = sizes[size];
  return (
    <span
      aria-hidden
      className={cx(
        'border-border bg-surface shrink-0 overflow-hidden border text-center',
        style.box,
        className,
      )}
    >
      <span
        className={cx(
          'block font-bold tracking-[0.06em] uppercase',
          style.head,
          muted ? 'bg-surface-strong text-text-muted' : 'bg-role-soft text-role-text',
        )}
      >
        {weekday}
      </span>
      <span
        className={cx('text-text block leading-none font-bold tracking-[-0.02em] tabular-nums', style.day)}
      >
        {day}
      </span>
    </span>
  );
}
