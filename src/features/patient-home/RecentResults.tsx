import { useQuery } from '@tanstack/react-query';
import { LuChevronRight, LuFileText } from 'react-icons/lu';
import { Link } from 'react-router';
import { QueryError, SectionCard, Skeleton } from '@components/ui';
import { tile } from '@components/ui/styles';
import { examResultUrl } from '@constants/areas';
import { civilDateInSaoPaulo, formatDate } from '@lib/date';
import { recentResultsQuery, type ResultSummary } from './patient-home-api';

function summaryText({ summary }: ResultSummary): string {
  if (!summary) return 'laudo disponível';
  if (summary.outOfRange === 0) return 'dentro da referência';
  return summary.outOfRange === 1
    ? '1 item fora da referência'
    : `${summary.outOfRange} itens fora da referência`;
}

export function RecentResults() {
  const query = useQuery(recentResultsQuery);
  const items = query.data?.items;
  return (
    <SectionCard title="Resultados recentes" flush aria-busy={query.isPending}>
      {query.isPending && (
        <div className="flex flex-col gap-3 p-4 lg:p-5">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}
      {query.isError && (
        <div className="p-4 lg:p-5">
          <QueryError error={query.error} onRetry={() => void query.refetch()} />
        </div>
      )}
      {items?.length === 0 && (
        <p className="text-text-muted px-4 py-6 text-center text-[0.8125rem] lg:px-5">
          Os resultados aparecem aqui quando ficarem prontos.
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="divide-border divide-y">
          {items.map((result) => (
            <li key={result.bookingId}>
              <Link
                to={examResultUrl(result.bookingId)}
                className="group can-hover:bg-surface-muted flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 lg:px-5"
              >
                <span aria-hidden className={tile}>
                  <LuFileText />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-text truncate text-sm font-semibold">{result.examType.name}</span>
                  <span className="text-text-secondary text-[0.8125rem]">
                    {formatDate(civilDateInSaoPaulo(new Date(result.startsAt)), { year: false })} ·{' '}
                    {summaryText(result)}
                  </span>
                </span>
                <LuChevronRight
                  aria-hidden
                  className="text-text-muted size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
