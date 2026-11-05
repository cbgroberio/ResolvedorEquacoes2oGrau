import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';

import { AppProviders } from '@/app/providers';
import { appRouter } from '@/app/router';
import { parseAppConfig } from '@/lib/config';
import { httpClient } from '@/lib/http';
import { logger } from '@/lib/logger';
import './styles.css';

async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await httpClient.get<unknown>('/config.json');
    parseAppConfig(response.data);
  } catch {
    logger.warn('Configuração /config.json ausente, aplicando valores padrão.');
    parseAppConfig({});
  }
}

export async function bootstrapApp(): Promise<void> {
  await loadRuntimeConfig();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    logger.error('Elemento #root não encontrado no DOM.');
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={appRouter} />
      </AppProviders>
    </StrictMode>,
  );
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  bootstrapApp().catch(() => {
    logger.error('Falha crítica ao inicializar a aplicação.');
  });
}

