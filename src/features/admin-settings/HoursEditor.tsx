import type { ChangeEvent } from 'react';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input, Switch } from '@components/ui';
import { WEEKDAYS } from '@constants/weekdays';
import { formatTimeInput } from '@lib/time-of-day';
import type { UnitValues } from './settings-schemas';

export interface HoursEditorProps {
  control: Control<UnitValues>;
  register: UseFormRegister<UnitValues>;
  errors: FieldErrors<UnitValues>;
}

const TIME_FIELDS = [
  { key: 'start', label: 'Abre', placeholder: '08:00' },
  { key: 'end', label: 'Fecha', placeholder: '18:00' },
] as const;

export function HoursEditor({ control, register, errors }: HoursEditorProps) {
  const hours = useWatch({ control, name: 'hours' });
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-text mb-1 text-[0.9375rem] font-semibold">Horário de funcionamento</legend>
      {WEEKDAYS.map((weekday, index) => {
        const open = hours[index]?.open ?? false;
        const dayErrors = errors.hours?.[index];
        return (
          <div key={weekday} className="border-border flex flex-col gap-2 border-b pb-3 last:border-b-0">
            <Controller
              control={control}
              name={`hours.${index}.open`}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} label={weekday} />
              )}
            />
            {open && (
              <div className="grid grid-cols-2 gap-3">
                {TIME_FIELDS.map(({ key, label, placeholder }) => {
                  const field = register(`hours.${index}.${key}`);
                  return (
                    <Input
                      key={key}
                      {...field}
                      label={label}
                      aria-label={`${label} (${weekday})`}
                      placeholder={placeholder}
                      inputMode="numeric"
                      maxLength={5}
                      error={dayErrors?.[key]?.message}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        event.target.value = formatTimeInput(event.target.value);
                        void field.onChange(event);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
