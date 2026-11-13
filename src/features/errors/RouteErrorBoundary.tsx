import { useEffect } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { APP_NAME } from '@components/layout/route-handle';
import { Button } from '@components/ui';
import { ErrorScreen } from './ErrorScreen';
import { ConnectionErrorPage, NotFoundPage } from './ErrorPages';

const reload = () => window.location.reload();

function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /dynamically imported module|Importing a module script failed/i.test(error.message)
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  const content =
    isRouteErrorResponse(error) && error.status === 404 ? (
      <NotFoundPage />
    ) : isChunkLoadError(error) ? (
      <ConnectionErrorPage onRetry={reload} />
    ) : (
      <ErrorScreen
        icon={<LuTriangleAlert />}
        title="Algo deu errado"
        description="Tente de novo. Se continuar, volte mais tarde."
        action={<Button onClick={reload}>Tentar de novo</Button>}
      />
    );

  return (
    <main data-role="patient" className="bg-canvas text-text min-h-dvh px-4">
      {content}
    </main>
  );
}
