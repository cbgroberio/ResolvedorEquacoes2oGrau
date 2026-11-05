import { type EquacaoResponse } from './equacao.schema';

export const INITIAL_EQUATION_RESULT: EquacaoResponse = {
  inputEquation: 'x^2 - 5x + 6 = 0',
  normalizedEquation: 'x² - 5x + 6 = 0',
  coefficients: { a: 1, b: -5, c: 6 },
  delta: 1,
  hasRealRoots: true,
  rootCount: 2,
  rootsStatusMessage:
    'Δ > 0: A equação possui duas raízes reais e distintas (x₁ = 2 e x₂ = 3).',
  roots: { x1: 2, x2: 3 },
  vertex: { x: 2.5, y: -0.25 },
  steps: [
    {
      stepNumber: 1,
      title: 'Forma Reduzida e Identificação dos Coeficientes',
      formula: 'ax² + bx + c = 0',
      calculation: 'x² - 5x + 6 = 0  ⇒  a = 1,  b = -5,  c = 6',
      explanation:
        'Igualamos a equação a zero na forma padrão ax² + bx + c = 0 e identificamos os coeficientes numéricos a (que acompanha x²), b (que acompanha x) e c (termo independente).',
    },
    {
      stepNumber: 2,
      title: 'Cálculo do Discriminante (Δ)',
      formula: 'Δ = b² - 4 · a · c',
      calculation: 'Δ = (-5)² - 4 · 1 · 6  ⇒  Δ = 25 - 24  ⇒  Δ = 1',
      explanation:
        'Substituímos os valores de a, b e c na fórmula do discriminante (Delta) para descobrir a natureza das raízes da equação.',
    },
    {
      stepNumber: 3,
      title: 'Análise do Discriminante (Δ)',
      formula: 'Δ > 0  ⇒  2 raízes reais distintas',
      calculation: 'Δ = 1 > 0  (√Δ = √1 ≈ 1)',
      explanation:
        'Como o valor de Δ é positivo (maior que zero), a equação admite duas raízes reais diferentes e a parábola intercepta o eixo X em dois pontos.',
    },
    {
      stepNumber: 4,
      title: 'Aplicação da Fórmula de Bhaskara',
      formula: 'x = (-b ± √Δ) / (2a)',
      calculation:
        'x = (-(-5) ± √1) / (2 · 1)  ⇒  x = (5 ± 1) / 2\n• x₁ = (5 - 1) / 2 = 4 / 2 = 2\n• x₂ = (5 + 1) / 2 = 6 / 2 = 3',
      explanation:
        'Aplicamos a Fórmula de Bhaskara calculando os dois caminhos (+√Δ e -√Δ), obtendo o conjunto solução S = { 2, 3 }.',
    },
    {
      stepNumber: 5,
      title: 'Vértice da Parábola e Projeção no Plano Cartesiano',
      formula: 'xᵥ = -b / (2a)   |   yᵥ = -Δ / (4a)',
      calculation:
        'xᵥ = 5 / 2 = 2.5   |   yᵥ = -(1) / (4 · 1) = -0.25   ⇒   V(2.5, -0.25)',
      explanation:
        'A parábola tem concavidade voltada para cima (a > 0, ponto de mínimo), vértice em V(2.5, -0.25) e intercepta o eixo Y em (0, 6).',
    },
  ],
  graphData: {
    minX: -2,
    maxX: 7,
    minY: -3.2875,
    maxY: 22.0375,
    yIntercept: { x: 0, y: 6 },
    points: [
      { x: -2, y: 20 },
      { x: 0, y: 6 },
      { x: 2, y: 0 },
      { x: 2.5, y: -0.25 },
      { x: 3, y: 0 },
      { x: 5, y: 6 },
      { x: 7, y: 20 },
    ],
  },
};

