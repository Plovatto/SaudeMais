import { LuHammer } from 'react-icons/lu';
import { Card, EmptyState } from '@components/ui';
import { PageHeader } from './PageHeader';
import { APP_NAME, useRouteHandle } from './route-handle';

export function PlaceholderPage() {
  const { title = APP_NAME } = useRouteHandle();
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState
          icon={<LuHammer />}
          title="Em construção"
          description="Esta tela chega nas próximas etapas do projeto."
        />
      </Card>
    </>
  );
}
