import { useMutation } from '@tanstack/react-query';

import {
  httpClient,
  normalizeHttpError,
  type ProblemDetails,
  resolveProblemMessage,
} from '@/lib/http';
import {
  type EquacaoResponse,
  equacaoResponseSchema,
} from '../model/equacao.schema';

export { resolveProblemMessage };

export const SOLVE_EQUATION_ENDPOINT = '/api/v1/equations/solve';

export const equacoesKeys = {
  all: ['equacoes'] as const,
  solve: (equation: string) => [...equacoesKeys.all, 'solve', equation] as const,
};

export async function solveEquacaoRequest(
  equation: string,
): Promise<EquacaoResponse> {
  try {
    const response = await httpClient.post<unknown>(SOLVE_EQUATION_ENDPOINT, {
      equation,
    });
    const parsed = equacaoResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      const invalidPayloadError: ProblemDetails = {
        type: 'urn:equacoes:erro:contrato',
        title: 'Resposta inválida do servidor',
        status: 502,
        detail: 'Os dados retornados pelo servidor não seguem o contrato OpenAPI.',
        traceId: 'zod-parse-error',
      };
      throw invalidPayloadError;
    }
    return parsed.data;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      'detail' in err &&
      'status' in err
    ) {
      throw err as ProblemDetails;
    }
    throw normalizeHttpError(err);
  }
}

export function useSolveEquacaoMutation() {
  return useMutation<EquacaoResponse, ProblemDetails, string>({
    mutationFn: solveEquacaoRequest,
  });
}

