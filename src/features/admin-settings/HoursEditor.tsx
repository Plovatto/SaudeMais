import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input, Switch } from '@components/ui';
import { WEEKDAYS, type UnitValues } from './settings-schemas';

export interface HoursEditorProps {
  control: Control<UnitValues>;
  register: UseFormRegister<UnitValues>;
  errors: FieldErrors<UnitValues>;
}

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
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label={`${weekday}: ${field.value ? 'aberta' : 'fechada'}`}
                />
              )}
            />
            {open && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Abre (${weekday})`}
                  labelHidden
                  placeholder="08:00"
                  inputMode="numeric"
                  error={dayErrors?.start?.message}
                  {...register(`hours.${index}.start`)}
                />
                <Input
                  label={`Fecha (${weekday})`}
                  labelHidden
                  placeholder="18:00"
                  inputMode="numeric"
                  error={dayErrors?.end?.message}
                  {...register(`hours.${index}.end`)}
                />
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
