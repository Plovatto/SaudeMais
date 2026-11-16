import { useQuery } from '@tanstack/react-query';
import { LuFileX, LuPrinter } from 'react-icons/lu';
import { useParams } from 'react-router';
import { ExamResultView } from '@components/exam-results/ExamResultView';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, ButtonLink, Card, EmptyState, QueryError, Skeleton } from '@components/ui';
import { PATIENT_PAST_PATH } from '@constants/areas';
import { ApiError } from '@lib/api/api-error';
import { apiFetch } from '@lib/api/api-fetch';
import { queryKeys } from '@lib/query-keys';

export function ExamResultPage() {
  const bookingId = useParams().id ?? '';
  const result = useQuery({
    queryKey: queryKeys.patient.examResult(bookingId),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/patient/exam-results/{bookingId}', { params: { bookingId }, signal }),
  });
  const missing = result.error instanceof ApiError && result.error.code === 'NOT_FOUND';

  return (
    <>
      <PageHeader title="Resultado do exame" back backFallback={PATIENT_PAST_PATH} />
      <Card className="flex flex-col gap-6">
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
