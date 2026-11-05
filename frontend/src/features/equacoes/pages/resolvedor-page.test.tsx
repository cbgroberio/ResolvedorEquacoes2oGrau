import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorRoute } from '@/app/error-route';
import { AppProviders } from '@/app/providers';
import { httpClient } from '@/lib/http';
import { expectNoA11yViolations } from '@/test/a11y';
import { useUiPreferencesStore } from '../hooks/use-theme-store';
import { INITIAL_EQUATION_RESULT } from '../model/initial-result';
import { ResolvedorPage } from './resolvedor-page';

describe('Página Principal do Resolvedor (ResolvedorPage)', () => {
  beforeEach(() => {
    useUiPreferencesStore.setState({ theme: 'light', zoomFactor: 1.0 });
  });

  it('renderiza estado inicial, passos de Bhaskara, gráfico e passa na auditoria WCAG 2.1 AA', async () => {
    const { container } = render(
      <AppProviders>
        <ResolvedorPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Resolvedor de Equações do 2º Grau',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('x² - 5x + 6 = 0').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Δ = 1')).toBeInTheDocument();
    expect(
      screen.getByText('1. Passo a Passo — Fórmula de Bhaskara'),
    ).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });

  it('permite inserir x², clicar em exemplo rápido, calcular Δ = 0 e Δ < 0 e alternar tema', async () => {
    const user = userEvent.setup();

    const deltaZeroResult = {
      ...INITIAL_EQUATION_RESULT,
      inputEquation: 'x^2 - 4x + 4 = 0',
      normalizedEquation: 'x² - 4x + 4 = 0',
      coefficients: { a: 1, b: -4, c: 4 },
      delta: 0,
      hasRealRoots: true,
      rootCount: 1,
      rootsStatusMessage: 'Δ = 0: Raiz dupla x = 2.',
      roots: { x1: 2, x2: 2 },
    };

    const deltaNegResult = {
      ...INITIAL_EQUATION_RESULT,
      inputEquation: 'x^2 + 2x + 5 = 0',
      normalizedEquation: 'x² + 2x + 5 = 0',
      coefficients: { a: 1, b: 2, c: 5 },
      delta: -16,
      hasRealRoots: false,
      rootCount: 0,
      rootsStatusMessage: 'Δ < 0: Sem raízes reais.',
      roots: { x1: null, x2: null },
    };

    const postSpy = jest
      .spyOn(httpClient, 'post')
      .mockResolvedValueOnce({ data: deltaZeroResult })
      .mockResolvedValueOnce({ data: deltaNegResult });

    render(
      <AppProviders>
        <ResolvedorPage />
      </AppProviders>,
    );

    const themeBtn = screen.getByRole('button', {
      name: /Alternar para modo escuro/i,
    });
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const chipZero = screen.getByRole('button', { name: /x² - 4x \+ 4 = 0/i });
    await user.click(chipZero);

    await waitFor(() => {
      expect(screen.getByText('x₁ = x₂ = 2')).toBeInTheDocument();
    });

    const insertSqBtn = screen.getByRole('button', { name: 'x²' });
    await user.click(insertSqBtn);

    const submitBtn = screen.getByRole('button', { name: /Calcular Equação/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('S = ∅ (Sem raízes em ℝ)')).toBeInTheDocument();
    });

    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it('exibe alerta de erro quando a equação é inválida e interage com controles do gráfico', async () => {
    const user = userEvent.setup();

    jest.spyOn(httpClient, 'post').mockRejectedValueOnce(
      new Error('Servidor indisponível no momento'),
    );

    render(
      <AppProviders>
        <ResolvedorPage />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: /Calcular Equação/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Servidor indisponível no momento',
      );
    });

    const zoomInBtn = screen.getByRole('button', {
      name: /Aproximar gráfico/i,
    });
    const zoomOutBtn = screen.getByRole('button', {
      name: /Afastar gráfico/i,
    });
    const resetBtn = screen.getByRole('button', {
      name: /Centralizar e resetar zoom/i,
    });

    await user.click(zoomInBtn);
    await user.click(zoomOutBtn);
    await user.click(resetBtn);

    const canvas = document.getElementById('cartesian-canvas');
    expect(canvas).not.toBeNull();
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      expect(screen.getByRole('status')).toHaveTextContent('f(x) =');

      fireEvent.mouseMove(canvas, { clientX: 5, clientY: 5 });
      fireEvent.mouseLeave(canvas);
    }
  });

  it('renderiza ErrorRoute de fallback da rota', () => {
    render(<ErrorRoute />);
    expect(
      screen.getByText('Ocorreu um erro inesperado na tela'),
    ).toBeInTheDocument();
  });
});

