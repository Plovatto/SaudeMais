import { createBrowserRouter, RouterProvider } from 'react-router';
import { ToastProvider } from '@components/ui';
import { routes } from './routes';

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
