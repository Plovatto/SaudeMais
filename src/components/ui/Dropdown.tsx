import { useEffect, useId, useRef, type ReactNode, type Ref, type RefObject } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { cx } from '@lib/cx';
import { moveFocus } from '@lib/roving-index';
import { Dialog } from './Dialog';
import type { FieldProps } from './field-props';
import { FieldControl } from './FieldControl';
import { IconSlot } from './IconSlot';
import { floatingPanel, softTones } from './styles';
import { useFloating } from './useFloating';

export interface DropdownOption {
  value: string;
  label: string;
  hint?: string | undefined;
}

export interface DropdownProps extends FieldProps {
  options: readonly DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  disabled?: boolean | undefined;
  ref?: Ref<HTMLButtonElement>;
}

function OptionList({
  id,
  label,
  options,
  value,
  onPick,
  initialRef,
}: {
  id: string;
  label: string;
  options: readonly DropdownOption[];
  value: string;
  onPick: (value: string) => void;
  initialRef: RefObject<HTMLButtonElement | null>;
}) {
  const hasSelected = options.some((option) => option.value === value);
  useEffect(() => {
    initialRef.current?.focus();
  }, [initialRef]);
  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      onKeyDown={(event) => moveFocus(event, '[role="option"]', 'vertical')}
      className="flex flex-col gap-0.5"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={selected || (!hasSelected && index === 0) ? initialRef : undefined}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onPick(option.value)}
            className={cx(
              'rounded-field flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-start transition-colors duration-150 max-lg:py-3.5',
              selected ? 'bg-role-soft' : 'can-hover:bg-surface-muted',
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cx('text-sm font-semibold', selected ? 'text-role-text' : 'text-text')}>
                {option.label}
              </span>
              {option.hint && <span className="text-text-muted text-xs">{option.hint}</span>}
            </span>
            <span
              aria-hidden
              className={cx(
                'grid size-[22px] shrink-0 place-items-center rounded-full transition-[opacity,scale] duration-150',
                selected ? 'bg-role-strong text-on-role scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
            >
              <LuCheck className="size-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  icon,
  disabled,
  ref,
  ...field
}: DropdownProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const { open, setOpen, dismiss, rootRef, contentId, triggerProps } = useFloating();
  const listId = useId();
  const initialRef = useRef<HTMLButtonElement>(null);
  const chosen = options.find((option) => option.value === value);
  const pick = (next: string) => {
    onChange(next);
    dismiss('escape');
  };
  const list = (
    <OptionList
      id={listId}
      label={field.label}
      options={options}
      value={value}
      onPick={pick}
      initialRef={initialRef}
    />
  );

  return (
    <div ref={rootRef} className="relative">
      <FieldControl
        {...field}
        boxClassName="has-[button:focus-visible]:border-role-strong has-[button:focus-visible]:outline-focus has-[button:disabled]:bg-surface-muted p-0 has-[button:disabled]:cursor-not-allowed has-[button:disabled]:opacity-60 has-[button:disabled]:shadow-none has-[button:focus-visible]:shadow-[0_0_0_3px_var(--role-soft-strong)] has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-2"
      >
        {(control) => (
          <button
            {...control}
            ref={(node) => {
              triggerProps.ref.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="button"
            disabled={disabled}
            aria-labelledby={`${control.id}-label ${control.id}-value`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? (desktop ? contentId : listId) : undefined}
            onClick={() => setOpen((current) => !current)}
            className="flex min-h-[inherit] w-full min-w-0 items-center gap-2.5 px-3 text-start focus-visible:outline-none disabled:cursor-not-allowed"
          >
            {icon && (
              <IconSlot className={cx(softTones.info, 'size-7 justify-center rounded-[8px] text-base')}>
                {icon}
              </IconSlot>
            )}
            <span
              id={`${control.id}-value`}
              className={cx(
                'min-w-0 flex-1 truncate text-[0.9375rem] font-semibold lg:text-sm',
                !chosen && 'text-text-muted font-normal',
              )}
            >
              {chosen?.label ?? placeholder}
            </span>
            <LuChevronDown
              aria-hidden
              className={cx(
                'text-text-muted size-4 shrink-0 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        )}
      </FieldControl>
      {open && desktop && (
        <div
          id={contentId}
          className={cx(floatingPanel('start'), 'mt-1.5 max-h-80 w-full overflow-y-auto p-1.5')}
        >
          {list}
        </div>
      )}
      {!desktop && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={field.label}
          placement="sheet"
          bare
          initialFocus={initialRef}
        >
          <div className="flex flex-col gap-1 px-3 pt-3 pb-4">
            <p aria-hidden className="text-text px-3 pt-1 pb-2.5 text-[1.0625rem] font-bold">
              {field.label}
            </p>
            {open && list}
          </div>
        </Dialog>
      )}
    </div>
  );
}
