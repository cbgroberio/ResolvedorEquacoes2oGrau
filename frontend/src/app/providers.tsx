import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import {
  applyDomTheme,
  useUiPreferencesStore,
} from '@/features/equacoes/hooks/use-theme-store';
import { queryClient } from '@/lib/query-client';

export type AppProvidersProps = {
  readonly children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useUiPreferencesStore((s) => s.theme);

  useEffect(() => {
    applyDomTheme(theme, false);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

