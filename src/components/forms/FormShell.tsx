import type { FormEvent, ReactNode } from 'react';
import { Button, DrawerBody, DrawerFooter, FormAlert, useDialogTitleId } from '@components/ui';

export interface FormShellProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  alert: string | null;
  submitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  children: ReactNode;
}

export function FormShell({
  onSubmit,
  alert,
  submitting,
  onCancel,
  submitLabel = 'Salvar',
  submitDisabled = false,
  children,
}: FormShellProps) {
  const titleId = useDialogTitleId();
  return (
    <form
      aria-labelledby={titleId}
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-1 flex-col"
    >
      <DrawerBody>
        {children}
        {alert && <FormAlert>{alert}</FormAlert>}
      </DrawerBody>
      <DrawerFooter>
        <Button variant="secondary" disabled={submitting} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </DrawerFooter>
    </form>
  );
}
