import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { LuFileX, LuLock } from 'react-icons/lu';
import { useLocation, useParams } from 'react-router';
import { ExpandableCard } from '@components/bookings/ExpandableCard';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { ButtonLink, Card, EmptyState } from '@components/ui';
import { areas } from '@constants/areas';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import { ApiError } from '@lib/api/api-error';
import { formatDateTime } from '@lib/date';
import { NO_LINK_MESSAGE } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { listPatientResults } from './results-api';
import type { ResultsLinkState } from './results-link';

const AGENDA = `${areas.doctor.base}/agenda`;
const DENIED = new Set(['FORBIDDEN_NO_LINK', 'VALIDATION_ERROR']);

const found = (total: number) => (total === 1 ? '1 resultado' : `${total} resultados`);

const isDenied = (error: unknown) => error instanceof ApiError && DENIED.has(error.code);

function patientName(state: unknown) {
  const name = (state as Partial<ResultsLinkState> | null)?.patientName;
  return typeof name === 'string' && name ? name : undefined;
}

export function PatientResultsPage() {
  const { id = '' } = useParams();
  const name = patientName(useLocation().state);
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: queryKeys.doctor.patientResults(id, page),
    queryFn: ({ signal }) => listPatientResults(id, page, signal),
    placeholderData: keepPreviousData,
  });
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);
  const results = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <PageHeader title={name ? `Exames de ${name}` : 'Exames do paciente'} back backFallback={AGENDA} />
      {isDenied(query.error) ? (
        <Card>
          <EmptyState
            icon={<LuLock />}
            title="Sem acesso aos exames deste paciente"
            description={NO_LINK_MESSAGE}
            action={
              <ButtonLink to={AGENDA} variant="secondary">
                Voltar para a agenda
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <PagedResults
            list={{ query, items: outOfRange ? undefined : query.data?.items, page, lastPage, setPage }}
            found={found}
            resultsRef={results}
            empty={
              <EmptyState
                icon={<LuFileX />}
                title="Nenhum resultado de exame"
                description="Os resultados deste paciente aparecem aqui quando o laboratório os enviar."
              />
            }
          >
            {(items) => (
              <ul className="flex flex-col gap-3">
                {items.map(({ booking, current }) => (
                  <li key={booking.id}>
                    <ExpandableCard
                      headline={
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-text font-semibold">{booking.examType.name}</span>
                          <span className="text-text-secondary text-sm">{booking.unit.name}</span>
                          <time dateTime={booking.startsAt} className="text-text-secondary text-sm">
                            {formatDateTime(booking.startsAt)}
                          </time>
                        </span>
                      }
                    >
                      <p className="text-text-secondary text-sm">
                        {current.items
                          ? current.items.map((item) => `${item.name}: ${item.value}`).join(', ')
                          : current.report}
                      </p>
                    </ExpandableCard>
                  </li>
                ))}
              </ul>
            )}
          </PagedResults>
        </div>
      )}
    </>
  );
}
