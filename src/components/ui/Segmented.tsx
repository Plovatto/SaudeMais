import { cx } from '@lib/cx';

export interface SegmentedProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onValueChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('bg-surface-strong flex gap-0.5 rounded-[10px] p-[3px]', className)}
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onValueChange(option.value)}
            className={cx(
              'min-h-11 flex-1 cursor-pointer rounded-lg px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 lg:min-h-8',
              pressed
                ? 'bg-surface text-text shadow-[0_1px_2px_rgb(16_42_41/0.08),0_0_0_1px_var(--border)]'
                : 'text-text-secondary can-hover:text-text',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
