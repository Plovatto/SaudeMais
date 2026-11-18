import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LuMonitor, LuSmartphone } from 'react-icons/lu';
import {
  Button,
  ConfirmDialog,
  FormAlert,
  ListPlaceholder,
  SectionCard,
  StatusChip,
  useToast,
} from '@components/ui';
import { tile } from '@components/ui/styles';
import { useSignOut } from '@lib/auth/useSignOut';
import { formatDateTime } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { describeUserAgent, isMobileUserAgent } from '@lib/user-agent';
import { endAllSessions, endOtherSessions, endSession, listSessions } from './profile-api';

const devicesText = (count: number) => (count === 1 ? '1 aparelho' : `${count} aparelhos`);

export function SessionsSection() {
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const { show } = useToast();
  const sessions = useQuery({ queryKey: queryKeys.sessions, queryFn: ({ signal }) => listSessions(signal) });
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const ended = (message: string) => async () => {
    show({ message, tone: 'success' });
    await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
  };
  const failed = async (error: unknown) => {
    show({ message: errorMessage(error), tone: 'danger' });
    await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
  };
  const endOne = useMutation({
    mutationFn: endSession,
    onSuccess: ended('Sessão encerrada.'),
    onError: failed,
  });
  const endOthers = useMutation({
    mutationFn: endOtherSessions,
    onSuccess: ended('As outras sessões foram encerradas.'),
    onError: failed,
  });

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

  const list = sessions.data;
  const others = list?.filter((session) => !session.current).length ?? 0;

  return (
    <SectionCard
      title="Sessões ativas"
      flush
      action={list && <span className="text-text-muted text-[0.8125rem]">{devicesText(list.length)}</span>}
    >
      {sessions.isError && (
        <div className="p-4 lg:p-5">
          <FormAlert>{errorMessage(sessions.error)}</FormAlert>
        </div>
      )}
      {list ? (
        <ul className="divide-border divide-y">
          {list.map((session) => {
            const device = describeUserAgent(session.userAgent);
            return (
              <li key={session.id} className="flex items-center gap-3.5 px-4 py-3.5 lg:px-5">
                <span aria-hidden className={tile}>
                  {isMobileUserAgent(session.userAgent) ? <LuSmartphone /> : <LuMonitor />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-text truncate text-sm font-semibold">{device}</p>
                  <p className="text-text-secondary text-[0.8125rem] tabular-nums">
                    Último acesso em {formatDateTime(session.lastUsedAt)}
                  </p>
                </div>
                {session.current ? (
                  <StatusChip tone="info" dot={false}>
                    Esta sessão
                  </StatusChip>
                ) : (
                  <Button
                    variant="danger-outline"
                    size="sm"
                    aria-label={`Encerrar sessão: ${device}`}
                    disabled={endOne.isPending && endOne.variables !== session.id}
                    loading={endOne.isPending && endOne.variables === session.id}
                    onClick={() => endOne.mutate(session.id)}
                  >
                    Encerrar
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        !sessions.isError && <ListPlaceholder pending message="" />
      )}
      <div className="border-border bg-surface-muted rounded-b-card flex flex-wrap items-center gap-3 border-t px-4 py-3 lg:px-5">
        <p className="text-text-muted min-w-0 flex-1 basis-56 text-xs">
          Se não reconhecer um aparelho, encerre a sessão e troque a senha.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={others === 0}
            loading={endOthers.isPending}
            onClick={() => endOthers.mutate()}
          >
            Encerrar as outras
          </Button>
          <Button variant="danger-ghost" size="sm" onClick={() => setConfirming(true)}>
            Sair de todas as sessões
          </Button>
        </div>
      </div>
      {alert && (
        <div className="px-4 pb-4 lg:px-5">
          <FormAlert>{alert}</FormAlert>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Sair de todas as sessões?"
        description="Sua conta será encerrada em todos os aparelhos, inclusive neste. Para voltar, entre de novo."
        confirmLabel="Sair de todas"
        loading={ending}
        onConfirm={() => void endEverywhere()}
      />
    </SectionCard>
  );
}
