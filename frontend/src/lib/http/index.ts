import axios, { type AxiosError, type AxiosInstance } from 'axios';

import { logger } from '@/lib/logger';
import { type ProblemDetails, toProblemDetails } from './problem-details';

const DEFAULT_TIMEOUT_MS = 8000;

export function normalizeHttpError(error: unknown): ProblemDetails {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<unknown>;
    const status = axiosErr.response?.status ?? 503;
    const data = axiosErr.response?.data;
    const problem = toProblemDetails(data, status);
    logger.warn('Erro HTTP recebido da API', {
      status: problem.status,
      type: problem.type,
      codigoRegra: problem.codigoRegra,
    });
    return problem;
  }

  if (error instanceof Error) {
    logger.error('Erro inesperado na camada HTTP', { message: error.message });
    return {
      type: 'urn:equacoes:erro:indisponivel',
      title: 'Falha na requisição',
      status: 503,
      detail: error.message,
      traceId: 'client-error',
    };
  }

  return toProblemDetails(null, 503);
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, application/problem+json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export { type ProblemDetails, resolveProblemMessage, toProblemDetails } from './problem-details';

