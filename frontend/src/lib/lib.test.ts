import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AxiosError, type AxiosResponse } from 'axios';

import {
  getAppConfig,
  parseAppConfig,
  resetAppConfig,
} from '@/lib/config';
import {
  normalizeHttpError,
  resolveProblemMessage,
  toProblemDetails,
} from '@/lib/http';
import { logger } from '@/lib/logger';
import { createAppQueryClient } from '@/lib/query-client';

describe('Infraestrutura cliente (src/lib)', () => {
  beforeEach(() => {
    logger.clearEntries();
    logger.setSink(null);
    resetAppConfig();
  });

  it('registra logs em buffer e notifica sink configurado', () => {
    const sink = jest.fn();
    logger.setSink(sink);

    logger.debug('msg debug', { step: 1 });
    logger.info('msg info');
    logger.warn('msg warn');
    logger.error('msg error');

    const entries = logger.getEntries();
    expect(entries).toHaveLength(4);
    expect(entries[0]?.level).toBe('debug');
    expect(entries[3]?.level).toBe('error');
    expect(sink).toHaveBeenCalledTimes(4);
  });

  it('valida configuração de runtime com Zod e aplica fallback quando inválida', () => {
    const valid = parseAppConfig({
      appName: 'App Custom',
      apiBaseUrl: '/api/custom',
      environment: 'development',
    });
    expect(valid.appName).toBe('App Custom');
    expect(getAppConfig().environment).toBe('development');

    const fallback = parseAppConfig({ environment: 'invalido' });
    expect(fallback.environment).toBe('production');
  });

  it('converte payloads diversos em ProblemDetails e resolve mensagens do catálogo', () => {
    const fromNull = toProblemDetails(null, 503);
    expect(fromNull.status).toBe(503);
    expect(fromNull.type).toBe('urn:equacoes:erro:indisponivel');

    const fromLegacy = toProblemDetails(
      {
        code: 'NOT_QUADRATIC_EQUATION',
        message: 'Coeficiente a zero',
        details: 'Informe ax²',
      },
      400,
    );
    expect(fromLegacy.codigoRegra).toBe('NOT_QUADRATIC_EQUATION');

    const resolvedCatalog = resolveProblemMessage(fromLegacy);
    expect(resolvedCatalog.message).toContain("coeficiente 'a' é igual a zero");
    expect(resolvedCatalog.details).toBe('Informe ax²');

    const fromCategory = toProblemDetails(
      {
        type: 'urn:equacoes:erro:validacao',
        title: 'Erro',
        status: 422,
        detail: 'Detalhe direto da API',
        dadosApoio: { details: 'Dica extra' },
      },
      422,
    );
    expect(fromCategory.status).toBe(422);
    expect(resolveProblemMessage(fromCategory).message).toBe(
      'Detalhe direto da API',
    );
  });

  it('normaliza AxiosError e Error genérico na camada HTTP', () => {
    const fakeResponse = {
      status: 400,
      data: {
        code: 'EMPTY_EQUATION',
        message: 'Vazia',
        details: 'Ex: x^2 = 0',
      },
    } as unknown as AxiosResponse;

    const axiosErr = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      fakeResponse,
    );

    const problem1 = normalizeHttpError(axiosErr);
    expect(problem1.status).toBe(400);
    expect(problem1.codigoRegra).toBe('EMPTY_EQUATION');

    const problem2 = normalizeHttpError(new Error('Falha de rede'));
    expect(problem2.status).toBe(503);
    expect(problem2.detail).toBe('Falha de rede');

    const problem3 = normalizeHttpError('erro desconhecido');
    expect(problem3.status).toBe(503);
  });

  it('cria QueryClient com opções padrão desabilitando retry em teste/app', () => {
    const client = createAppQueryClient();
    expect(client.getDefaultOptions().queries?.retry).toBe(false);
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });
});

