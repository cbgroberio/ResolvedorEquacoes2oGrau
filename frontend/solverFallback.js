/**
 * Motor matemático OpenAPI-compliant espelhado para fallback/testes caso o backend Java não esteja acessível.
 * Em operação normal, o server.js encaminha a requisição diretamente para o Backend Spring Boot (porta 8080).
 */

const ZERO_TOLERANCE = 1e-12;
const ROOT_DIFF_TOLERANCE = 1e-9;
const DECIMAL_PRECISION = 4;
const DEFAULT_SPAN = 4.0;
const ROOT_SPAN_MULTIPLIER = 1.8;
const SPAN_PADDING = 2.0;
const MAX_VERTEX_OFFSET = 15.0;
const GRAPH_SAMPLES = 120;
const MIN_Y_RANGE = 4.0;
const Y_PADDING_FACTOR = 0.15;
const MIN_BOUND_Y = -2.0;
const MAX_BOUND_Y = 2.0;

function createEquationError(code, message, details) {
  const err = new Error(message);
  err.code = code;
  err.details = details;
  return err;
}

function cleanZero(val) {
  if (Math.abs(val) < ZERO_TOLERANCE) {
    return 0;
  }
  return val;
}

function round4(val) {
  return Number(cleanZero(val).toFixed(DECIMAL_PRECISION));
}

function formatNumber(num) {
  const cleaned = cleanZero(num);
  return Number(cleaned.toFixed(DECIMAL_PRECISION)).toString();
}

function formatQuadraticTerm(a) {
  if (a === 1) {
    return 'x²';
  }
  if (a === -1) {
    return '-x²';
  }
  return `${formatNumber(a)}x²`;
}

function formatLinearTerm(b) {
  if (Math.abs(b) <= ZERO_TOLERANCE) {
    return '';
  }
  let sign = ' - ';
  if (b > 0) {
    sign = ' + ';
  }
  const absB = Math.abs(b);
  if (absB === 1) {
    return `${sign}x`;
  }
  return `${sign}${formatNumber(absB)}x`;
}

function formatConstantTerm(c) {
  if (Math.abs(c) <= ZERO_TOLERANCE) {
    return '';
  }
  let sign = ' - ';
  if (c > 0) {
    sign = ' + ';
  }
  return `${sign}${formatNumber(Math.abs(c))}`;
}

function formatNormalizedEquation(a, b, c) {
  return `${formatQuadraticTerm(a)}${formatLinearTerm(b)}${formatConstantTerm(c)} = 0`;
}

function parseCoefficientValue(coeffPart, hasVar) {
  if (!coeffPart || coeffPart === '+') {
    if (!hasVar) {
      throw createEquationError(
        'INVALID_SYNTAX',
        'Sinal sem número correspondente na equação.',
        'Verifique os sinais de "+" e "-" na equação digitada.',
      );
    }
    return 1;
  }

  if (coeffPart === '-') {
    if (!hasVar) {
      throw createEquationError(
        'INVALID_SYNTAX',
        'Sinal de menos isolado na equação.',
        'Verifique os sinais na equação digitada.',
      );
    }
    return -1;
  }

  const val = Number(coeffPart);
  if (Number.isNaN(val)) {
    throw createEquationError(
      'INVALID_NUMBER',
      `Número inválido encontrado: '${coeffPart}'.`,
      'Use números inteiros ou decimais válidos.',
    );
  }
  return val;
}

function parsePolynomialSide(side) {
  if (/x\^(?!2($|[+-]))/i.test(side)) {
    throw createEquationError(
      'UNSUPPORTED_DEGREE',
      'A equação possui potência de x diferente de 1 ou 2.',
      'Apenas equações do 2º grau (ax² + bx + c = 0) são suportadas.',
    );
  }

  let a = 0;
  let b = 0;
  let c = 0;

  const termRegex = /([+-]?\d*(?:\.\d+)?)(x(?:\^2|²|\*\*2)?|x)?/gi;
  let index = 0;

  while (index < side.length) {
    termRegex.lastIndex = index;
    const match = termRegex.exec(side);
    const isInvalidMatch =
      !match || match.index !== index || match[0].length === 0;
    if (isInvalidMatch) {
      throw createEquationError(
        'INVALID_SYNTAX',
        `Não foi possível interpretar o trecho '${side.slice(index)}' da equação.`,
        'Use o formato ax^2 + bx + c = 0 (ex: 2x^2 - 4x - 6 = 0).',
      );
    }

    const coeffPart = match[1];
    const varPart = match[2];
    const val = parseCoefficientValue(coeffPart, Boolean(varPart));

    if (!varPart) {
      c += val;
    } else if (varPart.toLowerCase() === 'x') {
      b += val;
    } else {
      a += val;
    }

    index = termRegex.lastIndex;
  }

  return [a, b, c];
}

function normalizeRawEquationString(rawEquation) {
  if (!rawEquation || typeof rawEquation !== 'string' || !rawEquation.trim()) {
    throw createEquationError(
      'EMPTY_EQUATION',
      'Por favor, digite uma equação do 2º grau.',
      'Exemplo: x^2 - 5x + 6 = 0',
    );
  }

  const cleaned = rawEquation
    .trim()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '.')
    .replace(/\*x/gi, 'x')
    .replace(/X/g, 'x')
    .replace(/x²/g, 'x^2')
    .replace(/x\*\*2/g, 'x^2');

  const sides = cleaned.split('=');
  if (sides.length > 2) {
    throw createEquationError(
      'INVALID_SYNTAX',
      "A equação contém múltiplos sinais de igualdade ('=').",
      'Digite apenas uma igualdade, por exemplo: x^2 - 5x + 6 = 0',
    );
  }

  const leftSide = sides[0];
  let rightSide = '0';
  if (sides.length === 2) {
    rightSide = sides[1];
  }

  if (!leftSide || !rightSide) {
    throw createEquationError(
      'INVALID_SYNTAX',
      'Um dos lados da equação está vazio.',
      'Exemplo válido: x^2 - 5x + 6 = 0',
    );
  }

  return { leftSide, rightSide };
}

function computeRootsInfo(a, b, rawDelta) {
  let delta = rawDelta;
  const hasRealRoots = delta >= -ZERO_TOLERANCE;

  if (Math.abs(delta) < ZERO_TOLERANCE) {
    delta = 0;
    const root = round4(cleanZero(-b / (2 * a)));
    return {
      delta,
      hasRealRoots: true,
      rootCount: 1,
      x1: root,
      x2: root,
      rootsStatusMessage: `Δ = 0: A equação possui raízes reais e iguais (uma única raiz real dupla: x = ${formatNumber(root)}).`,
    };
  }

  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = round4(cleanZero((-b - sqrtDelta) / (2 * a)));
    const r2 = round4(cleanZero((-b + sqrtDelta) / (2 * a)));
    const x1 = Math.min(r1, r2);
    const x2 = Math.max(r1, r2);
    return {
      delta,
      hasRealRoots: true,
      rootCount: 2,
      x1,
      x2,
      rootsStatusMessage: `Δ > 0: A equação possui duas raízes reais e distintas (x₁ = ${formatNumber(x1)} e x₂ = ${formatNumber(x2)}).`,
    };
  }

  return {
    delta,
    hasRealRoots,
    rootCount: 0,
    x1: null,
    x2: null,
    rootsStatusMessage:
      'Δ < 0: A equação não possui raízes reais (não há interseção da parábola com o eixo X).',
  };
}

function wrapNegative(num, formatted) {
  if (num < 0) {
    return `(${formatted})`;
  }
  return formatted;
}

function buildStep3(delta, fDelta) {
  if (delta > 0) {
    return {
      stepNumber: 3,
      title: 'Análise do Discriminante (Δ)',
      formula: 'Δ > 0  ⇒  2 raízes reais distintas',
      calculation: `Δ = ${fDelta} > 0  (√Δ = √${fDelta} ≈ ${formatNumber(Math.sqrt(delta))})`,
      explanation:
        'Como o valor de Δ é positivo (maior que zero), a equação admite duas raízes reais diferentes e a parábola intercepta o eixo X em dois pontos.',
    };
  }
  if (delta === 0) {
    return {
      stepNumber: 3,
      title: 'Análise do Discriminante (Δ)',
      formula: 'Δ = 0  ⇒  1 raiz real dupla (x₁ = x₂)',
      calculation: 'Δ = 0  (√Δ = 0)',
      explanation:
        'Como o valor de Δ é igual a zero, a equação possui duas raízes reais iguais (uma única raiz real) e o vértice da parábola tangencia o eixo X.',
    };
  }
  return {
    stepNumber: 3,
    title: 'Análise do Discriminante (Δ)',
    formula: 'Δ < 0  ⇒  Não existem raízes no conjunto dos números reais (ℝ)',
    calculation: `Δ = ${fDelta} < 0  (√${fDelta} ∉ ℝ)`,
    explanation:
      'Como o valor de Δ é negativo (menor que zero), não existe raiz quadrada real de número negativo. Portanto, a equação não possui raízes reais e a parábola não toca o eixo X.',
  };
}

function buildStep4(a, b, delta, x1, x2, bParen, aParen, fDelta) {
  const minusB = formatNumber(cleanZero(-b));
  const twoA = formatNumber(cleanZero(2 * a));

  if (delta >= 0 && x1 !== null && x2 !== null) {
    const sqrtStr = formatNumber(Math.sqrt(delta));
    const num1 = formatNumber(cleanZero(-b - Math.sqrt(delta)));
    const num2 = formatNumber(cleanZero(-b + Math.sqrt(delta)));
    const res1 = formatNumber(cleanZero((-b - Math.sqrt(delta)) / (2 * a)));
    const res2 = formatNumber(cleanZero((-b + Math.sqrt(delta)) / (2 * a)));

    let solutionSet = formatNumber(x1);
    if (Math.abs(x1 - x2) > ROOT_DIFF_TOLERANCE) {
      solutionSet = `${formatNumber(x1)}, ${formatNumber(x2)}`;
    }

    return {
      stepNumber: 4,
      title: 'Aplicação da Fórmula de Bhaskara',
      formula: 'x = (-b ± √Δ) / (2a)',
      calculation:
        `x = (-${bParen} ± √${fDelta}) / (2 · ${aParen})  ⇒  x = (${minusB} ± ${sqrtStr}) / ${twoA}\n` +
        `• x₁ = (${minusB} - ${sqrtStr}) / ${twoA} = ${num1} / ${twoA} = ${res1}\n` +
        `• x₂ = (${minusB} + ${sqrtStr}) / ${twoA} = ${num2} / ${twoA} = ${res2}`,
      explanation: `Aplicamos a Fórmula de Bhaskara calculando os dois caminhos (+√Δ e -√Δ), obtendo o conjunto solução S = { ${solutionSet} }.`,
    };
  }

  return {
    stepNumber: 4,
    title: 'Aplicação da Fórmula de Bhaskara',
    formula: 'x = (-b ± √Δ) / (2a)',
    calculation: `x = (-${bParen} ± √(${fDelta})) / (2 · ${aParen})  ⇒  S = ∅ (Conjunto Vazio em ℝ)`,
    explanation:
      'Como Δ < 0, o cálculo das raízes reais se encerra aqui, pois √Δ não pertence ao conjunto dos números reais (ℝ). O conjunto solução real é vazio (S = ∅).',
  };
}

function buildResolutionSteps(params) {
  const { a, b, c, normalizedEquation, bSquared, fourAC, delta, x1, x2, vx, vy } =
    params;
  const fa = formatNumber(a);
  const fb = formatNumber(b);
  const fc = formatNumber(c);
  const fDelta = formatNumber(delta);
  const aParen = wrapNegative(a, fa);
  const bParen = wrapNegative(b, fb);
  const cParen = wrapNegative(c, fc);

  let signFourAC = `- ${formatNumber(Math.abs(fourAC))}`;
  if (-fourAC >= 0) {
    signFourAC = `+ ${formatNumber(-fourAC)}`;
  }

  const minusB = formatNumber(cleanZero(-b));
  const twoA = formatNumber(cleanZero(2 * a));

  let concavityDesc = 'voltada para baixo (a < 0, ponto de máximo)';
  if (a > 0) {
    concavityDesc = 'voltada para cima (a > 0, ponto de mínimo)';
  }

  return [
    {
      stepNumber: 1,
      title: 'Forma Reduzida e Identificação dos Coeficientes',
      formula: 'ax² + bx + c = 0',
      calculation: `${normalizedEquation}  ⇒  a = ${fa},  b = ${fb},  c = ${fc}`,
      explanation:
        'Igualamos a equação a zero na forma padrão ax² + bx + c = 0 e identificamos os coeficientes numéricos a (que acompanha x²), b (que acompanha x) e c (termo independente).',
    },
    {
      stepNumber: 2,
      title: 'Cálculo do Discriminante (Δ)',
      formula: 'Δ = b² - 4 · a · c',
      calculation: `Δ = ${bParen}² - 4 · ${aParen} · ${cParen}  ⇒  Δ = ${formatNumber(bSquared)} ${signFourAC}  ⇒  Δ = ${fDelta}`,
      explanation:
        'Substituímos os valores de a, b e c na fórmula do discriminante (Delta) para descobrir a natureza das raízes da equação.',
    },
    buildStep3(delta, fDelta),
    buildStep4(a, b, delta, x1, x2, bParen, aParen, fDelta),
    {
      stepNumber: 5,
      title: 'Vértice da Parábola e Projeção no Plano Cartesiano',
      formula: 'xᵥ = -b / (2a)   |   yᵥ = -Δ / (4a)',
      calculation: `xᵥ = ${minusB} / ${twoA} = ${formatNumber(vx)}   |   yᵥ = -(${fDelta}) / (4 · ${aParen}) = ${formatNumber(vy)}   ⇒   V(${formatNumber(vx)}, ${formatNumber(vy)})`,
      explanation: `A parábola tem concavidade ${concavityDesc}, vértice em V(${formatNumber(vx)}, ${formatNumber(vy)}) e intercepta o eixo Y em (0, ${fc}).`,
    },
  ];
}

function buildGraphData(a, b, c, vx, vy, x1, x2) {
  let span = DEFAULT_SPAN;
  if (x1 !== null && x2 !== null) {
    const rootDist = Math.abs(x2 - vx);
    span = Math.max(span, rootDist * ROOT_SPAN_MULTIPLIER + SPAN_PADDING);
  }
  if (Math.abs(vx) < MAX_VERTEX_OFFSET) {
    span = Math.max(span, Math.abs(vx) + SPAN_PADDING);
  }

  const minX = round4(vx - span);
  const maxX = round4(vx + span);
  const step = (maxX - minX) / GRAPH_SAMPLES;

  const points = [];
  let minY = Math.min(0, vy);
  let maxY = Math.max(0, vy);

  for (let i = 0; i <= GRAPH_SAMPLES; i++) {
    const x = round4(minX + i * step);
    const y = round4(cleanZero(a * x * x + b * x + c));
    points.push({ x, y });
    if (y < minY) {
      minY = y;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  const yRange = Math.max(Math.abs(maxY - minY), MIN_Y_RANGE);
  const yPadding = yRange * Y_PADDING_FACTOR;

  return {
    minX,
    maxX,
    minY: round4(Math.min(minY - yPadding, MIN_BOUND_Y)),
    maxY: round4(Math.max(maxY + yPadding, MAX_BOUND_Y)),
    yIntercept: { x: 0, y: round4(c) },
    points,
  };
}

function solveQuadraticEquation(rawEquation) {
  const { leftSide, rightSide } = normalizeRawEquationString(rawEquation);
  const leftCoeffs = parsePolynomialSide(leftSide);
  const rightCoeffs = parsePolynomialSide(rightSide);

  const a = cleanZero(leftCoeffs[0] - rightCoeffs[0]);
  const b = cleanZero(leftCoeffs[1] - rightCoeffs[1]);
  const c = cleanZero(leftCoeffs[2] - rightCoeffs[2]);

  if (Math.abs(a) < ZERO_TOLERANCE) {
    throw createEquationError(
      'NOT_QUADRATIC_EQUATION',
      "O coeficiente 'a' é igual a zero (a = 0). Esta não é uma equação do 2º grau.",
      'Uma equação do 2º grau deve conter o termo x² com coeficiente diferente de zero (ex: x^2 - 5x + 6 = 0).',
    );
  }

  const normalizedEquation = formatNormalizedEquation(a, b, c);
  const bSquared = cleanZero(b * b);
  const fourAC = cleanZero(4 * a * c);
  const rawDelta = cleanZero(bSquared - fourAC);

  const rootsInfo = computeRootsInfo(a, b, rawDelta);
  const vx = round4(cleanZero(-b / (2 * a)));
  const vy = round4(cleanZero(-rootsInfo.delta / (4 * a)));

  const steps = buildResolutionSteps({
    a,
    b,
    c,
    normalizedEquation,
    bSquared,
    fourAC,
    delta: rootsInfo.delta,
    x1: rootsInfo.x1,
    x2: rootsInfo.x2,
    vx,
    vy,
  });

  const graphData = buildGraphData(a, b, c, vx, vy, rootsInfo.x1, rootsInfo.x2);

  return {
    inputEquation: rawEquation.trim(),
    normalizedEquation,
    coefficients: { a: round4(a), b: round4(b), c: round4(c) },
    delta: round4(rootsInfo.delta),
    hasRealRoots: rootsInfo.hasRealRoots,
    rootCount: rootsInfo.rootCount,
    rootsStatusMessage: rootsInfo.rootsStatusMessage,
    roots: { x1: rootsInfo.x1, x2: rootsInfo.x2 },
    vertex: { x: vx, y: vy },
    steps,
    graphData,
  };
}

module.exports = { solveQuadraticEquation };
