import { isRouteErrorResponse, useRouteError } from 'react-router';
import { MainContent, pageSurface } from '@components/layout/MainContent';
import { DEFAULT_ROLE } from '@constants/areas';
import { ConnectionErrorPage, NotFoundPage, UnexpectedErrorPage } from './ErrorPages';

const reload = () => window.location.reload();

function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /dynamically imported module|Importing a module script failed/i.test(error.message)
  );
}

export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (isChunkLoadError(error)) return <ConnectionErrorPage onRetry={reload} />;
  return <UnexpectedErrorPage onRetry={reload} />;
}

export function RouteErrorBoundary() {
  return (
    <div data-role={DEFAULT_ROLE} className={pageSurface}>
      <MainContent className="px-4">
        <RouteError />
      </MainContent>
    </div>
  );
}
