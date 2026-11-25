import { useState, type RefObject } from 'react';
import { LuLogOut } from 'react-icons/lu';
import { ConfirmDialog } from '@components/ui';
import { useSignOut } from '@lib/auth/useSignOut';

export function useSignOutConfirm(fallbackFocus?: RefObject<HTMLElement | null>) {
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dialog = (
    <ConfirmDialog
      open={open}
      onClose={() => setOpen(false)}
      title="Sair da conta?"
      description="Você vai precisar entrar de novo com seu e-mail e senha."
      icon={<LuLogOut />}
      centered
      tone="primary"
      cancelLabel="Continuar aqui"
      confirmLabel="Sair"
      loading={leaving}
      fallbackFocus={fallbackFocus}
      onConfirm={() => {
        setLeaving(true);
        void signOut();
      }}
    />
  );

  return { ask: () => setOpen(true), dialog };
}
