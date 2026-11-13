export interface FieldProps {
  label: string;
  labelHidden?: boolean | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  'aria-describedby'?: string | undefined;
}

interface FieldOwnProps extends FieldProps {
  id?: string | undefined;
  className?: string | undefined;
}

export function splitFieldProps<T extends FieldOwnProps>(props: T) {
  const { id, label, labelHidden, hint, error, 'aria-describedby': describedBy, className, ...rest } = props;
  const field: FieldOwnProps = {
    id,
    label,
    labelHidden,
    hint,
    error,
    'aria-describedby': describedBy,
    className,
  };
  return [field, rest] as const;
}
