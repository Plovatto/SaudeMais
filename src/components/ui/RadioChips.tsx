import { useId } from 'react';
import { LuCheck } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { pill } from './styles';

export interface RadioChipsProps<T extends string> {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onValueChange: (value: T) => void;
}

export function RadioChips<T extends string>({ legend, options, value, onValueChange }: RadioChipsProps<T>) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-text mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cx(
                pill.base,
                'has-[:focus-visible]:outline-focus inline-flex cursor-pointer items-center gap-1.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                checked ? pill.selected : pill.idle,
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
              {checked && (
                <IconSlot>
                  <LuCheck />
                </IconSlot>
              )}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
