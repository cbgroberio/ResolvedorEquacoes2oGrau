import { z } from 'zod';

export const appConfigSchema = z.object({
  appName: z.string().default('Resolvedor de Equações do 2º Grau'),
  apiBaseUrl: z.string().default('/api'),
  environment: z.enum(['development', 'test', 'production']).default('production'),
});

export type AppConfig = Readonly<z.infer<typeof appConfigSchema>>;

const DEFAULT_CONFIG: AppConfig = {
  appName: 'Resolvedor de Equações do 2º Grau',
  apiBaseUrl: '/api',
  environment: 'production',
};

let currentConfig: AppConfig = DEFAULT_CONFIG;

export function parseAppConfig(raw: unknown): AppConfig {
  const parsed = appConfigSchema.safeParse(raw);
  if (parsed.success) {
    currentConfig = parsed.data;
    return currentConfig;
  }
  currentConfig = DEFAULT_CONFIG;
  return currentConfig;
}

export function getAppConfig(): AppConfig {
  return currentConfig;
}

export function resetAppConfig(): void {
  currentConfig = DEFAULT_CONFIG;
}

