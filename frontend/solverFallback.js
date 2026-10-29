/**
 * Motor matemático OpenAPI-compliant espelhado para fallback/testes caso o backend Java não esteja acessível.
 * Em operação normal, o server.js encaminha a requisição diretamente para o Backend Spring Boot (porta 8080).
 */

function cleanZero(val) {
  return Math.abs(val) < 1e-12 ? 0 : val;
}

function round4(val) {
  return Number(cleanZero(val).toFixed(4));
}

function formatNumber(num) {
  const cleaned = cleanZero(num);
  return Number(cleaned.toFixed(4)).toString();
}

function formatNormalizedEquation(a, b, c) {
  let sb = '';
  if (a === 1) sb += 'x²';
  else if (a === -1) sb += '-x²';
  else sb += `${formatNumber(a)}x²`;

  if (Math.abs(b) > 1e-12) {
    sb += b > 0 ? ' + ' : ' - ';
    const absB = Math.abs(b);
    sb += absB === 1 ? 'x' : `${formatNumber(absB)}x`;
  }

  if (Math.abs(c) > 1e-12) {
    sb += c > 0 ? ' + ' : ' - ';
    sb += formatNumber(Math.abs(c));
  }

  sb += ' = 0';
  return sb;
}

function parsePolynomialSide(side) {
  if (/x\^(?!2($|[+-]))/i.test(side)) {
    const err = new Error('A equação possui potência de x diferente de 1 ou 2.');
    err.code = 'UNSUPPORTED_DEGREE';
    err.details = 'Apenas equações do 2º grau (ax² + bx + c = 0) são suportadas.';
    throw err;
  }

  let a = 0;
  let b = 0;
  let c = 0;

  const termRegex = /([+-]?\d*(?:\.\d+)?)(x(?:\^2|²|\*\*2)?|x)?/gi;
  let index = 0;

  while (index < side.length) {
    termRegex.lastIndex = index;
    const match = termRegex.exec(side);
    if (!match || match.index !== index || match[0].length === 0) {
      const err = new Error(`Não foi possível interpretar o trecho '${side.slice(index)}' da equação.`);
      err.code = 'INVALID_SYNTAX';
      err.details = 'Use o formato ax^2 + bx + c = 0 (ex: 2x^2 - 4x - 6 = 0).';
      throw err;
    }

    const coeffPart = match[1];
    const varPart = match[2];
    const hasVar = Boolean(varPart);

    let val;
    if (!coeffPart || coeffPart === '+') {
      if (!hasVar) {
        const err = new Error('Sinal sem número correspondente na equação.');
        err.code = 'INVALID_SYNTAX';
        err.details = 'Verifique os sinais de "+" e "-" na equação digitada.';
        throw err;
      }
      val = 1;
    } else if (coeffPart === '-') {
      if (!hasVar) {
        const err = new Error('Sinal de menos isolado na equação.');
        err.code = 'INVALID_SYNTAX';
        err.details = 'Verifique os sinais na equação digitada.';
        throw err;
      }
      val = -1;
    } else {
      val = Number(coeffPart);
      if (Number.isNaN(val)) {
        const err = new Error(`Número inválido encontrado: '${coeffPart}'.`);
        err.code = 'INVALID_NUMBER';
        err.details = 'Use números inteiros ou decimais válidos.';
        throw err;
      }
    }

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

function solveQuadraticEquation(rawEquation) {
  if (!rawEquation || typeof rawEquation !== 'string' || !rawEquation.trim()) {
    const err = new Error('Por favor, digite uma equação do 2º grau.');
    err.code = 'EMPTY_EQUATION';
    err.details = 'Exemplo: x^2 - 5x + 6 = 0';
    throw err;
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
    const err = new Error("A equação contém múltiplos sinais de igualdade ('=').");
    err.code = 'INVALID_SYNTAX';
    err.details = 'Digite apenas uma igualdade, por exemplo: x^2 - 5x + 6 = 0';
    throw err;
  }

  const leftSide = sides[0];
  const rightSide = sides.length === 2 ? sides[1] : '0';

  if (!leftSide || !rightSide) {
    const err = new Error('Um dos lados da equação está vazio.');
    err.code = 'INVALID_SYNTAX';
    err.details = 'Exemplo válido: x^2 - 5x + 6 = 0';
    throw err;
  }

  const leftCoeffs = parsePolynomialSide(leftSide);
  const rightCoeffs = parsePolynomialSide(rightSide);

  const a = cleanZero(leftCoeffs[0] - rightCoeffs[0]);
  const b = cleanZero(leftCoeffs[1] - rightCoeffs[1]);
  const c = cleanZero(leftCoeffs[2] - rightCoeffs[2]);

  if (Math.abs(a) < 1e-12) {
    const err = new Error("O coeficiente 'a' é igual a zero (a = 0). Esta não é uma equação do 2º grau.");
    err.code = 'NOT_QUADRATIC_EQUATION';
    err.details = 'Uma equação do 2º grau deve conter o termo x² com coeficiente diferente de zero (ex: x^2 - 5x + 6 = 0).';
    throw err;
  }

  const normalizedEquation = formatNormalizedEquation(a, b, c);
  const bSquared = cleanZero(b * b);
  const fourAC = cleanZero(4 * a * c);
  let delta = cleanZero(bSquared - fourAC);

  const hasRealRoots = delta >= -1e-12;
  let rootCount = 0;
  let rootsStatusMessage = '';
  let x1 = null;
  let x2 = null;

  if (Math.abs(delta) < 1e-12) {
    delta = 0;
    rootCount = 1;
    const root = round4(cleanZero(-b / (2 * a)));
    x1 = root;
    x2 = root;
    rootsStatusMessage = `Δ = 0: A equação possui raízes reais e iguais (uma única raiz real dupla: x = ${formatNumber(root)}).`;
  } else if (delta > 0) {
    rootCount = 2;
    const sqrtDelta = Math.sqrt(delta);
    const r1 = round4(cleanZero((-b - sqrtDelta) / (2 * a)));
    const r2 = round4(cleanZero((-b + sqrtDelta) / (2 * a)));
    x1 = Math.min(r1, r2);
    x2 = Math.max(r1, r2);
    rootsStatusMessage = `Δ > 0: A equação possui duas raízes reais e distintas (x₁ = ${formatNumber(x1)} e x₂ = ${formatNumber(x2)}).`;
  } else {
    rootCount = 0;
    rootsStatusMessage = 'Δ < 0: A equação não possui raízes reais (não há interseção da parábola com o eixo X).';
  }

  const vx = round4(cleanZero(-b / (2 * a)));
  const vy = round4(cleanZero(-delta / (4 * a)));

  const fa = formatNumber(a);
  const fb = formatNumber(b);
  const fc = formatNumber(c);
  const fDelta = formatNumber(delta);
  const bParen = b < 0 ? `(${fb})` : fb;
  const aParen = a < 0 ? `(${fa})` : fa;
  const cParen = c < 0 ? `(${fc})` : fc;
  const signFourAC = -fourAC >= 0 ? `+ ${formatNumber(-fourAC)}` : `- ${formatNumber(Math.abs(fourAC))}`;
  const minusB = formatNumber(cleanZero(-b));
  const twoA = formatNumber(cleanZero(2 * a));

  const steps = [
    {
      stepNumber: 1,
      title: 'Forma Reduzida e Identificação dos Coeficientes',
      formula: 'ax² + bx + c = 0',
      calculation: `${normalizedEquation}  ⇒  a = ${fa},  b = ${fb},  c = ${fc}`,
      explanation: 'Igualamos a equação a zero na forma padrão ax² + bx + c = 0 e identificamos os coeficientes numéricos a (que acompanha x²), b (que acompanha x) e c (termo independente).'
    },
    {
      stepNumber: 2,
      title: 'Cálculo do Discriminante (Δ)',
      formula: 'Δ = b² - 4 · a · c',
      calculation: `Δ = ${bParen}² - 4 · ${aParen} · ${cParen}  ⇒  Δ = ${formatNumber(bSquared)} ${signFourAC}  ⇒  Δ = ${fDelta}`,
      explanation: 'Substituímos os valores de a, b e c na fórmula do discriminante (Delta) para descobrir a natureza das raízes da equação.'
    },
    {
      stepNumber: 3,
      title: 'Análise do Discriminante (Δ)',
      formula: delta > 0
        ? 'Δ > 0  ⇒  2 raízes reais distintas'
        : delta === 0
          ? 'Δ = 0  ⇒  1 raiz real dupla (x₁ = x₂)'
          : 'Δ < 0  ⇒  Não existem raízes no conjunto dos números reais (ℝ)',
      calculation: delta > 0
        ? `Δ = ${fDelta} > 0  (√Δ = √${fDelta} ≈ ${formatNumber(Math.sqrt(delta))})`
        : delta === 0
          ? 'Δ = 0  (√Δ = 0)'
          : `Δ = ${fDelta} < 0  (√${fDelta} ∉ ℝ)`,
      explanation: delta > 0
        ? 'Como o valor de Δ é positivo (maior que zero), a equação admite duas raízes reais diferentes e a parábola intercepta o eixo X em dois pontos.'
        : delta === 0
          ? 'Como o valor de Δ é igual a zero, a equação possui duas raízes reais iguais (uma única raiz real) e o vértice da parábola tangencia o eixo X.'
          : 'Como o valor de Δ é negativo (menor que zero), não existe raiz quadrada real de número negativo. Portanto, a equação não possui raízes reais e a parábola não toca o eixo X.'
    },
    delta >= 0 && x1 !== null && x2 !== null
      ? {
          stepNumber: 4,
          title: 'Aplicação da Fórmula de Bhaskara',
          formula: 'x = (-b ± √Δ) / (2a)',
          calculation:
            `x = (-${bParen} ± √${fDelta}) / (2 · ${aParen})  ⇒  x = (${minusB} ± ${formatNumber(Math.sqrt(delta))}) / ${twoA}\n` +
            `• x₁ = (${minusB} - ${formatNumber(Math.sqrt(delta))}) / ${twoA} = ${formatNumber(cleanZero(-b - Math.sqrt(delta)))} / ${twoA} = ${formatNumber(cleanZero((-b - Math.sqrt(delta)) / (2 * a)))}\n` +
            `• x₂ = (${minusB} + ${formatNumber(Math.sqrt(delta))}) / ${twoA} = ${formatNumber(cleanZero(-b + Math.sqrt(delta)))} / ${twoA} = ${formatNumber(cleanZero((-b + Math.sqrt(delta)) / (2 * a)))}`,
          explanation: `Aplicamos a Fórmula de Bhaskara calculando os dois caminhos (+√Δ e -√Δ), obtendo o conjunto solução S = { ${formatNumber(x1)}${Math.abs(x1 - x2) > 1e-9 ? ', ' + formatNumber(x2) : ''} }.`
        }
      : {
          stepNumber: 4,
          title: 'Aplicação da Fórmula de Bhaskara',
          formula: 'x = (-b ± √Δ) / (2a)',
          calculation: `x = (-${bParen} ± √(${fDelta})) / (2 · ${aParen})  ⇒  S = ∅ (Conjunto Vazio em ℝ)`,
          explanation: 'Como Δ < 0, o cálculo das raízes reais se encerra aqui, pois √Δ não pertence ao conjunto dos números reais (ℝ). O conjunto solução real é vazio (S = ∅).'
        },
    {
      stepNumber: 5,
      title: 'Vértice da Parábola e Projeção no Plano Cartesiano',
      formula: 'xᵥ = -b / (2a)   |   yᵥ = -Δ / (4a)',
      calculation: `xᵥ = ${minusB} / ${twoA} = ${formatNumber(vx)}   |   yᵥ = -(${fDelta}) / (4 · ${aParen}) = ${formatNumber(vy)}   ⇒   V(${formatNumber(vx)}, ${formatNumber(vy)})`,
      explanation: `A parábola tem concavidade ${a > 0 ? 'voltada para cima (a > 0, ponto de mínimo)' : 'voltada para baixo (a < 0, ponto de máximo)'}, vértice em V(${formatNumber(vx)}, ${formatNumber(vy)}) e intercepta o eixo Y em (0, ${fc}).`
    }
  ];

  let span = 4.0;
  if (x1 !== null && x2 !== null) {
    const rootDist = Math.abs(x2 - vx);
    span = Math.max(span, rootDist * 1.8 + 2.0);
  }
  if (Math.abs(vx) < 15.0) {
    span = Math.max(span, Math.abs(vx) + 2.0);
  }

  const minX = round4(vx - span);
  const maxX = round4(vx + span);
  const numSamples = 120;
  const step = (maxX - minX) / numSamples;

  const points = [];
  let minY = Math.min(0, vy);
  let maxY = Math.max(0, vy);

  for (let i = 0; i <= numSamples; i++) {
    const x = round4(minX + i * step);
    const y = round4(cleanZero(a * x * x + b * x + c));
    points.push({ x, y });
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const yRange = Math.max(Math.abs(maxY - minY), 4.0);
  const yPadding = yRange * 0.15;
  const finalMinY = round4(Math.min(minY - yPadding, -2.0));
  const finalMaxY = round4(Math.max(maxY + yPadding, 2.0));

  return {
    inputEquation: rawEquation.trim(),
    normalizedEquation,
    coefficients: { a: round4(a), b: round4(b), c: round4(c) },
    delta: round4(delta),
    hasRealRoots,
    rootCount,
    rootsStatusMessage,
    roots: { x1, x2 },
    vertex: { x: vx, y: vy },
    steps,
    graphData: {
      minX,
      maxX,
      minY: finalMinY,
      maxY: finalMaxY,
      yIntercept: { x: 0, y: round4(c) },
      points
    }
  };
}

module.exports = { solveQuadraticEquation };
