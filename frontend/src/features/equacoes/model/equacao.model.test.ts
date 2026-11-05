import { describe, expect, it, jest } from '@jest/globals';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  chooseNiceStep,
  drawCartesianPlaneOnCanvas,
  getCanvasThemePalette,
  getViewportBounds,
} from './cartesian-canvas';
import {
  equacaoFormSchema,
  equacaoResponseSchema,
  formatMathNumber,
} from './equacao.schema';
import { INITIAL_EQUATION_RESULT } from './initial-result';

describe('Modelo, Schemas e Renderizador Cartesiano (features/equacoes/model)', () => {
  it('valida entrada do formulário com equacaoFormSchema (aceitação e rejeição)', () => {
    const valid = equacaoFormSchema.safeParse({ equation: 'x^2 - 5x + 6 = 0' });
    expect(valid.success).toBe(true);

    const empty = equacaoFormSchema.safeParse({ equation: '   ' });
    expect(empty.success).toBe(false);

    const tooLong = equacaoFormSchema.safeParse({
      equation: 'x'.repeat(130),
    });
    expect(tooLong.success).toBe(false);
  });

  it('valida resposta da API com equacaoResponseSchema', () => {
    const valid = equacaoResponseSchema.safeParse(INITIAL_EQUATION_RESULT);
    expect(valid.success).toBe(true);

    const invalid = equacaoResponseSchema.safeParse({ delta: 'invalido' });
    expect(invalid.success).toBe(false);
  });

  it('formata números matemáticos limpando resíduos próximos de zero', () => {
    expect(formatMathNumber(null)).toBe('—');
    expect(formatMathNumber(undefined)).toBe('—');
    expect(formatMathNumber(Number.NaN)).toBe('—');
    expect(formatMathNumber(1e-15)).toBe('0');
    expect(formatMathNumber(2.5000001)).toBe('2.5');
    expect(formatMathNumber(-3.14159)).toBe('-3.1416');
  });

  it('calcula limites de viewport, passos da grade e paleta do Canvas', () => {
    const lightPalette = getCanvasThemePalette('light');
    const darkPalette = getCanvasThemePalette('dark');
    expect(lightPalette.parabola).toBe('#004b8d');
    expect(darkPalette.bg).toBe('#0c111d');

    const bounds = getViewportBounds(INITIAL_EQUATION_RESULT, 1.0);
    expect(bounds.minX).toBeCloseTo(-2);
    expect(bounds.maxX).toBeCloseTo(7);

    expect(chooseNiceStep(80)).toBe(10);
    expect(chooseNiceStep(30)).toBe(5);
    expect(chooseNiceStep(12)).toBe(2);
    expect(chooseNiceStep(6)).toBe(1);
  });

  it('desenha o plano cartesiano no contexto 2D para Δ > 0, Δ = 0 e Δ < 0 nos dois temas', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    if (!ctx) {
      return;
    }

    const fillTextSpy = jest.spyOn(ctx, 'fillText');

    drawCartesianPlaneOnCanvas(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      INITIAL_EQUATION_RESULT,
      1.0,
      'light',
    );
    expect(fillTextSpy).toHaveBeenCalled();

    const singleRootData = {
      ...INITIAL_EQUATION_RESULT,
      coefficients: { a: -1, b: 4, c: -4 },
      delta: 0,
      rootCount: 1,
      roots: { x1: 2, x2: 2 },
    };
    drawCartesianPlaneOnCanvas(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      singleRootData,
      0.8,
      'dark',
    );

    const noRootData = {
      ...INITIAL_EQUATION_RESULT,
      delta: -16,
      hasRealRoots: false,
      rootCount: 0,
      roots: { x1: null, x2: null },
    };
    drawCartesianPlaneOnCanvas(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      noRootData,
      1.2,
      'light',
    );
  });
});

