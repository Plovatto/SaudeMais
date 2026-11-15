import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { LuMapPin } from 'react-icons/lu';
import { FieldError, IconSlot } from '@components/ui';
import type { ResponseOf } from '@lib/api/api-fetch';
import { cx } from '@lib/cx';
import { formatPhone } from '@lib/phone';

type Unit = ResponseOf<'/api/units', 'get'>[number];

export interface UnitCardsProps {
  units: Unit[] | undefined;
  note: string | null;
  error: string | undefined;
  field: UseFormRegisterReturn<'unitId'>;
}

export function UnitCards({ units, note, error, field }: UnitCardsProps) {
  const id = useId();
  const noteId = note ? `${id}-note` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset
      aria-describedby={[errorId, noteId].filter(Boolean).join(' ') || undefined}
      className="flex flex-col gap-2"
    >
      <legend className="text-text mb-1.5 text-[0.9375rem] font-semibold">Local do exame</legend>
      {note && (
        <p id={noteId} className="text-text-secondary text-sm">
          {note}
        </p>
      )}
      {units && units.length > 0 && (
        <div className="grid gap-3 min-[26rem]:grid-cols-2">
          {units.map((unit) => (
            <label
              key={unit.id}
              className={cx(
                'rounded-tile bg-surface has-checked:border-role-strong has-checked:ring-role-strong has-focus-visible:outline-focus flex min-h-14 cursor-pointer items-start gap-3 border p-3 transition-colors has-checked:ring-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                error ? 'border-danger' : 'border-border can-hover:border-text-secondary',
              )}
            >
              <input
                type="radio"
                value={unit.id}
                aria-invalid={error ? true : undefined}
                className="sr-only"
                {...field}
              />
              <IconSlot className="bg-role-strong text-on-role size-7 shrink-0 justify-center rounded-full">
                <LuMapPin />
              </IconSlot>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-text text-sm font-semibold">{unit.name}</span>
                <span className="text-text-secondary text-xs">{unit.address}</span>
                <span className="text-text-secondary text-xs">{formatPhone(unit.phone)}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
