import { useQuery } from '@tanstack/react-query';
import { LuFileText } from 'react-icons/lu';
import { ListPlaceholder, ListRow, QueryError, SectionCard } from '@components/ui';
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
      {query.isError && !items ? (
        <QueryError padded error={query.error} onRetry={() => void query.refetch()} />
      ) : items?.length ? (
        <ul className="divide-border divide-y">
          {items.map((result) => (
            <li key={result.bookingId}>
              <ListRow
                to={examResultUrl(result.bookingId)}
                leading={
                  <span aria-hidden className={tile}>
                    <LuFileText />
                  </span>
                }
                title={result.examType.name}
                meta={`${formatDate(civilDateInSaoPaulo(new Date(result.startsAt)), { year: false })} · ${summaryText(result)}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ListPlaceholder
          pending={query.isPending}
          message="Os resultados aparecem aqui quando ficarem prontos."
        />
      )}
    </SectionCard>
  );
}
