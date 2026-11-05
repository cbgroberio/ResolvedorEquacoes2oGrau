import { describe, expect, it, jest } from '@jest/globals';
import { AxiosError, type AxiosResponse } from 'axios';

import { httpClient, type ProblemDetails } from '@/lib/http';
import { INITIAL_EQUATION_RESULT } from '../model/initial-result';
import {
  equacoesKeys,
  SOLVE_EQUATION_ENDPOINT,
  solveEquacaoRequest,
} from './solve-equacao';

describe('Camada API de Equações (features/equacoes/api)', () => {
  it('gera query keys padronizadas', () => {
    expect(equacoesKeys.all).toEqual(['equacoes']);
    expect(equacoesKeys.solve('x^2 = 4')).toEqual([
      'equacoes',
      'solve',
      'x^2 = 4',
    ]);
  });

  it('envia POST para /api/v1/equations/solve e valida resposta com Zod', async () => {
    const postSpy = jest
      .spyOn(httpClient, 'post')
      .mockResolvedValueOnce({ data: INITIAL_EQUATION_RESULT });

    const result = await solveEquacaoRequest('x^2 - 5x + 6 = 0');
    expect(postSpy).toHaveBeenCalledWith(SOLVE_EQUATION_ENDPOINT, {
      equation: 'x^2 - 5x + 6 = 0',
    });
    expect(result.delta).toBe(1);
    expect(result.roots.x1).toBe(2);
  });

  it('rejeita com ProblemDetails 502 quando o payload da resposta viola o schema Zod', async () => {
    jest
      .spyOn(httpClient, 'post')
      .mockResolvedValueOnce({ data: { invalid: true } });

    await expect(solveEquacaoRequest('x^2 = 0')).rejects.toMatchObject({
      status: 502,
      type: 'urn:equacoes:erro:contrato',
    });
  });

  it('converte erro HTTP 400 do servidor em ProblemDetails tipado', async () => {
    const fakeResponse = {
      status: 400,
      data: {
        type: 'urn:equacoes:erro:validacao',
        title: 'Equação inválida',
        status: 400,
        detail: 'Coeficiente a igual a zero.',
        codigoRegra: 'NOT_QUADRATIC_EQUATION',
      },
    } as unknown as AxiosResponse;

    jest.spyOn(httpClient, 'post').mockRejectedValueOnce(
      new AxiosError(
        'Bad Request',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        fakeResponse,
      ),
    );

    let caughtError: ProblemDetails | null = null;
    try {
      await solveEquacaoRequest('4x - 8 = 0');
    } catch (err) {
      caughtError = err as ProblemDetails;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.status).toBe(400);
    expect(caughtError?.codigoRegra).toBe('NOT_QUADRATIC_EQUATION');
  });
});

