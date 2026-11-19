import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { SplashGate } from '@components/layout/SplashGate';
import { ToastProvider } from '@components/ui';
import { createQueryClient } from '@lib/query-client';
import { routes } from './routes';

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
const queryClient = createQueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SplashGate>
          <RouterProvider router={router} />
        </SplashGate>
      </ToastProvider>
    </QueryClientProvider>
  );
}
