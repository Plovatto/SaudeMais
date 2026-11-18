import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Dropdown, SettingRow, Switch, type DropdownProps } from '@components/ui';

interface ControlledProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

export type FormDropdownProps<T extends FieldValues> = ControlledProps<T> &
  Omit<DropdownProps, 'value' | 'onChange' | 'error' | 'ref'> & { numeric?: boolean };

export function FormDropdown<T extends FieldValues>({
  control,
  name,
  numeric = false,
  ...props
}: FormDropdownProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Dropdown
      {...props}
      ref={field.ref}
      value={String(field.value ?? '')}
      onChange={(value) => field.onChange(numeric ? Number(value) : value)}
      error={fieldState.error?.message}
    />
  );
}

export function ActiveField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
}: ControlledProps<T> & { label: string; hint: string }) {
  const { field } = useController({ control, name });
  return (
    <SettingRow
      className="border-border rounded-tile gap-4 border px-4 py-3"
      title={label}
      meta={hint}
      trailing={
        <Switch checked={field.value === true} onCheckedChange={field.onChange} label={label} labelHidden />
      }
    />
  );
}
