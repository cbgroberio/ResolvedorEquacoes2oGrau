import { z } from 'zod';

const MAX_EQUATION_LENGTH = 120;
const ZERO_THRESHOLD = 1e-12;
const DECIMAL_PLACES = 4;

export const equacaoFormSchema = z.object({
  equation: z
    .string()
    .trim()
    .min(1, 'Por favor, digite uma equação do 2º grau (ex: x² - 5x + 6 = 0).')
    .max(
      MAX_EQUATION_LENGTH,
      `A equação deve ter no máximo ${MAX_EQUATION_LENGTH} caracteres.`,
    ),
});

export type EquacaoFormValues = z.infer<typeof equacaoFormSchema>;

export const point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const resolutionStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  formula: z.string(),
  calculation: z.string(),
  explanation: z.string(),
});

export const coefficientsSchema = z.object({
  a: z.number(),
  b: z.number(),
  c: z.number(),
});

export const rootsSchema = z.object({
  x1: z.number().nullable(),
  x2: z.number().nullable(),
});

export const graphDataSchema = z.object({
  minX: z.number(),
  maxX: z.number(),
  minY: z.number(),
  maxY: z.number(),
  yIntercept: point2DSchema,
  points: z.array(point2DSchema),
});

export const equacaoResponseSchema = z.object({
  inputEquation: z.string(),
  normalizedEquation: z.string(),
  coefficients: coefficientsSchema,
  delta: z.number(),
  hasRealRoots: z.boolean(),
  rootCount: z.number(),
  rootsStatusMessage: z.string(),
  roots: rootsSchema,
  vertex: point2DSchema,
  steps: z.array(resolutionStepSchema),
  graphData: graphDataSchema,
});

export type Point2D = Readonly<z.infer<typeof point2DSchema>>;
export type ResolutionStep = Readonly<z.infer<typeof resolutionStepSchema>>;
export type Coefficients = Readonly<z.infer<typeof coefficientsSchema>>;
export type Roots = Readonly<z.infer<typeof rootsSchema>>;
export type GraphData = Readonly<z.infer<typeof graphDataSchema>>;
export type EquacaoResponse = Readonly<z.infer<typeof equacaoResponseSchema>>;

export type QuickExample = {
  readonly label: string;
  readonly tag: string;
  readonly equation: string;
};

export const INITIAL_EQUATION = 'x^2 - 5x + 6 = 0';

export const QUICK_EXAMPLES: readonly QuickExample[] = [
  {
    label: 'x² - 5x + 6 = 0',
    tag: '(Δ > 0)',
    equation: 'x^2 - 5x + 6 = 0',
  },
  {
    label: 'x² - 4x + 4 = 0',
    tag: '(Δ = 0)',
    equation: 'x^2 - 4x + 4 = 0',
  },
  {
    label: 'x² + 2x + 5 = 0',
    tag: '(Δ < 0)',
    equation: 'x^2 + 2x + 5 = 0',
  },
  {
    label: '-x² + 2x + 3 = 0',
    tag: '(a < 0)',
    equation: '-x^2 + 2x + 3 = 0',
  },
  {
    label: '2x² - 8 = 0',
    tag: '(Incompleta)',
    equation: '2x^2 - 8 = 0',
  },
];

export function formatMathNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || Number.isNaN(Number(num))) {
    return '—';
  }
  let cleaned = Number(num);
  if (Math.abs(cleaned) < ZERO_THRESHOLD) {
    cleaned = 0;
  }
  return Number(cleaned.toFixed(DECIMAL_PLACES)).toString();
}

