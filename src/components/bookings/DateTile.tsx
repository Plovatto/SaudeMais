import { cx } from '@lib/cx';
import { dayTile } from '@lib/date';

const sizes = {
  md: {
    box: 'size-[52px] rounded-tile',
    head: 'pt-[3px] pb-0.5 text-[0.65625rem]/normal',
    day: 'text-[1.1875rem]/none',
  },
  lg: {
    box: 'size-[68px] rounded-[14px]',
    head: 'pt-[5px] pb-1 text-[0.71875rem]/normal',
    day: 'text-[1.75rem]/none',
  },
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
        'border-border bg-surface flex shrink-0 flex-col overflow-hidden border text-center',
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
        className={cx(
          'text-text grid flex-1 place-items-center font-bold tracking-[-0.02em] tabular-nums',
          style.day,
        )}
      >
        {day}
      </span>
    </span>
  );
}
