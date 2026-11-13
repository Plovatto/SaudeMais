import type { FormEvent, ReactNode } from 'react';
import { Button, FormAlert } from '@components/ui';

export interface FormShellProps {
  label: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  alert: string | null;
  submitting: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  children: ReactNode;
}

export function FormShell({
  label,
  onSubmit,
  alert,
  submitting,
  onCancel,
  submitLabel = 'Salvar',
  children,
}: FormShellProps) {
  return (
    <form
      aria-label={label}
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-5"
    >
      {children}
      {alert && <FormAlert>{alert}</FormAlert>}
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
