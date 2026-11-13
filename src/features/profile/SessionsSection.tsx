import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LuMonitorSmartphone } from 'react-icons/lu';
import { Button, Dialog, FormAlert, IconSlot, Skeleton, StatusChip } from '@components/ui';
import { useSignOut } from '@lib/auth/useSignOut';
import { formatDateTime } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { describeUserAgent } from '@lib/user-agent';
import { endAllSessions, listSessions } from './profile-api';
import { ProfileSection } from './ProfileSection';

export function SessionsSection() {
  const signOut = useSignOut();
  const sessions = useQuery({ queryKey: queryKeys.sessions, queryFn: ({ signal }) => listSessions(signal) });
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const endEverywhere = async () => {
    setEnding(true);
    setAlert(null);
    try {
      await endAllSessions();
      await signOut({ notifyServer: false });
    } catch (error) {
      setAlert(errorMessage(error));
      setEnding(false);
      setConfirming(false);
    }
  };

  return (
    <ProfileSection title="Sessões ativas" description="Aparelhos em que sua conta está aberta agora.">
      {sessions.isPending && <Skeleton className="h-16 w-full" />}
      {sessions.isError && <FormAlert>{errorMessage(sessions.error)}</FormAlert>}
      {sessions.data && (
        <ul className="flex flex-col gap-3">
          {sessions.data.map((session) => (
            <li key={session.id} className="rounded-tile border-border flex items-center gap-3 border p-3">
              <IconSlot className="text-text-secondary text-xl">
                <LuMonitorSmartphone />
              </IconSlot>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-text text-sm font-semibold">
                  {describeUserAgent(session.userAgent)}
                </span>
                <span className="text-text-secondary text-sm">
                  Último acesso em {formatDateTime(session.lastUsedAt)}
                </span>
              </div>
              {session.current && <StatusChip tone="info">Esta sessão</StatusChip>}
            </li>
          ))}
        </ul>
      )}
      {alert && <FormAlert>{alert}</FormAlert>}
      <Button variant="secondary" className="self-start" onClick={() => setConfirming(true)}>
        Sair de todas as sessões
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Sair de todas as sessões?"
        description="Sua conta será encerrada em todos os aparelhos, inclusive neste. Para voltar, entre de novo."
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={ending} onClick={() => void endEverywhere()}>
            Sair de todas
          </Button>
        </div>
      </Dialog>
    </ProfileSection>
  );
}
