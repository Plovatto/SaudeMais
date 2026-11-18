import { useMutation, useQuery } from '@tanstack/react-query';
import { LuDownload, LuFileText, LuFileX } from 'react-icons/lu';
import { useParams } from 'react-router';
import { PreviousVersions } from '@components/exam-results/PreviousVersions';
import { ResultMeta } from '@components/exam-results/ResultMeta';
import { ReportText } from '@components/exam-results/ResultVersion';
import { PageColumn } from '@components/layout/PageColumn';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Button,
  ButtonLink,
  EmptyState,
  FormAlert,
  QueryError,
  SectionCard,
  Skeleton,
  useToast,
} from '@components/ui';
import { PATIENT_PAST_PATH } from '@constants/areas';
import { useLeaveSignal } from '@hooks/useLeaveSignal';
import { ApiError } from '@lib/api/api-error';
import { apiDownload, apiFetch } from '@lib/api/api-fetch';
import { formatCivilDate } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { saveFile } from '@lib/save-file';
import { ResultItems } from './ResultItems';
import { ResultSummary } from './ResultSummary';

const GONE_CODES = new Set(['NOT_FOUND', 'VALIDATION_ERROR']);

const DOWNLOAD_LABEL = 'Baixar laudo em PDF';

const PDF_TIMEOUT_MS = 60_000;

export function ExamResultPage() {
  const bookingId = useParams().id ?? '';
  const { show } = useToast();
  const result = useQuery({
    queryKey: queryKeys.patient.examResult(bookingId),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/patient/exam-results/{bookingId}', { params: { bookingId }, signal }),
  });
  const leaving = useLeaveSignal();
  const download = useMutation({
    mutationFn: () =>
      apiDownload('/api/patient/exam-results/{bookingId}/pdf', {
        params: { bookingId },
        signal: leaving.current.signal,
        timeoutMs: PDF_TIMEOUT_MS,
      }),
    onSuccess: (file) => saveFile(file, `laudo-${result.data?.booking.publicCode ?? bookingId}.pdf`),
    onError: (error) => {
      if (!leaving.current.signal.aborted) show({ tone: 'danger', message: errorMessage(error) });
    },
  });
  const missing = result.error instanceof ApiError && GONE_CODES.has(result.error.code);
  const data = result.data;

  if (!data) {
    return (
      <PageColumn>
        <PageHeader title="Resultado do exame" back backFallback={PATIENT_PAST_PATH} />
        {result.isPending && (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="rounded-card h-24" />
            <Skeleton className="rounded-card h-80" />
          </div>
        )}
        {missing && (
          <EmptyState
            icon={<LuFileX />}
            title="Resultado não encontrado"
            description="Este exame ainda não tem resultado ou não está mais disponível."
            action={
              <ButtonLink to={PATIENT_PAST_PATH} variant="secondary">
                Voltar para meus agendamentos
              </ButtonLink>
            }
          />
        )}
        {result.isError && !missing && (
          <QueryError error={result.error} onRetry={() => void result.refetch()} />
        )}
      </PageColumn>
    );
  }

  const { booking, current, previous } = data;
  const collected = formatCivilDate(booking.startsAt);
  const meta = <ResultMeta version={current} />;

  return (
    <PageColumn>
      <PageHeader
        title={booking.examType.name}
        subtitle={`Coletado em ${collected} · ${booking.unit.name}`}
        back
        backFallback={PATIENT_PAST_PATH}
        action={
          <Button
            variant="secondary"
            icon={<LuDownload />}
            loading={download.isPending}
            loadingLabel="Gerando PDF"
            onClick={() => download.mutate()}
          >
            {download.isPending ? 'Gerando PDF…' : DOWNLOAD_LABEL}
          </Button>
        }
      />
      <div className="flex flex-col gap-6">
        {current.items ? (
          <>
            <ResultSummary items={current.items} />
            <ResultItems items={current.items} meta={meta} />
            <div className="-mt-3">
              <FormAlert tone="quiet" role="note" icon={<LuFileText />}>
                Os indicadores comparam cada resultado com a faixa de referência do laboratório. Converse com
                seu médico sobre o que eles significam para você.
              </FormAlert>
            </div>
          </>
        ) : (
          <SectionCard title="Laudo" action={meta} className="motion-safe:animate-rise">
            <ReportText report={current.report ?? ''} />
          </SectionCard>
        )}
        {previous.length > 0 && <PreviousVersions versions={previous} headingLevel={2} />}
      </div>
    </PageColumn>
  );
}
