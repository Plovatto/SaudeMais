import { useId } from 'react';
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
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        'bg-surface-strong flex min-w-0 gap-0.5 overflow-hidden rounded-[10px] p-[3px]',
        className,
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cx(
              'has-[:focus-visible]:outline-focus flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 sm:px-3 lg:min-h-8',
              checked
                ? 'bg-surface text-text shadow-[0_1px_2px_rgb(16_42_41/0.08),0_0_0_1px_var(--border)]'
                : 'text-text-secondary can-hover:text-text',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onValueChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
