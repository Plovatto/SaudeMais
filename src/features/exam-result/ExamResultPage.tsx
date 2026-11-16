import { useQuery } from '@tanstack/react-query';
import { LuFileX, LuPrinter } from 'react-icons/lu';
import { useParams } from 'react-router';
import { ExamResultView } from '@components/exam-results/ExamResultView';
import { PageHeader } from '@components/layout/PageHeader';
import { APP_NAME } from '@components/layout/route-handle';
import { Button, ButtonLink, Card, EmptyState, QueryError, Skeleton } from '@components/ui';
import { PATIENT_PAST_PATH } from '@constants/areas';
import { ApiError } from '@lib/api/api-error';
import { apiFetch } from '@lib/api/api-fetch';
import { useCurrentUser } from '@lib/auth/useSession';
import { formatDateTime } from '@lib/date';
import { queryKeys } from '@lib/query-keys';

const GONE_CODES = new Set(['NOT_FOUND', 'VALIDATION_ERROR']);

export function ExamResultPage() {
  const bookingId = useParams().id ?? '';
  const result = useQuery({
    queryKey: queryKeys.patient.examResult(bookingId),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/patient/exam-results/{bookingId}', { params: { bookingId }, signal }),
  });
  const missing = result.error instanceof ApiError && GONE_CODES.has(result.error.code);
  const { fullName } = useCurrentUser();

  return (
    <>
      <div className="mb-4 hidden text-sm print:block">
        <p className="font-semibold">{APP_NAME}</p>
        <p>Paciente: {fullName}</p>
        <p>Impresso em {formatDateTime(new Date().toISOString())}</p>
      </div>
      <PageHeader title="Resultado do exame" back backFallback={PATIENT_PAST_PATH} />
      <Card className="flex flex-col gap-6 print:border-0 print:p-0">
        {result.isPending && (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-28" />
            <Skeleton className="h-48" />
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
        {result.data && (
          <>
            <ExamResultView result={result.data} />
            <Button
              variant="secondary"
              icon={<LuPrinter />}
              onClick={() => window.print()}
              className="self-start print:hidden"
            >
              Imprimir
            </Button>
          </>
        )}
      </Card>
    </>
  );
}
