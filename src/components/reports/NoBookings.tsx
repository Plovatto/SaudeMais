import { LuChartColumn } from 'react-icons/lu';
import { Card, EmptyState } from '@components/ui';

export function NoBookings() {
  return (
    <Card>
      <EmptyState
        icon={<LuChartColumn />}
        title="Nenhum agendamento no período"
        description="Escolha outro período para ver os números."
      />
    </Card>
  );
}
