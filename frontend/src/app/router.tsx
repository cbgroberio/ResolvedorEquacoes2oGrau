import { createBrowserRouter } from 'react-router';

import { equacoesRoutes } from '@/features/equacoes/routes';
import { ErrorRoute } from './error-route';

export const appRouter = createBrowserRouter([
  {
    errorElement: <ErrorRoute />,
    children: [...equacoesRoutes],
  },
]);

