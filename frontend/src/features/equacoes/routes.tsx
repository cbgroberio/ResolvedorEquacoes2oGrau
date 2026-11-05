import { type RouteObject } from 'react-router';

export const EQUACOES_ROUTES = {
  ROOT: '/',
} as const;

export const equacoesRoutes: RouteObject[] = [
  {
    path: EQUACOES_ROUTES.ROOT,
    lazy: async () => {
      const { ResolvedorPage } = await import('./pages/resolvedor-page');
      return { Component: ResolvedorPage };
    },
  },
];

