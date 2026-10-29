const assert = require('node:assert');
const { solveQuadraticEquation } = require('../solverFallback');

console.log('Iniciando bateria de testes do Resolvedor OpenAPI (Bhaskara & Plano Cartesiano)...');

// Teste 1: Delta > 0 (duas raízes reais distintas)
{
  const res = solveQuadraticEquation('x^2 - 5x + 6 = 0');
  assert.strictEqual(res.coefficients.a, 1);
  assert.strictEqual(res.coefficients.b, -5);
  assert.strictEqual(res.coefficients.c, 6);
  assert.strictEqual(res.delta, 1);
  assert.strictEqual(res.hasRealRoots, true);
  assert.strictEqual(res.rootCount, 2);
  assert.strictEqual(res.roots.x1, 2);
  assert.strictEqual(res.roots.x2, 3);
  assert.strictEqual(res.vertex.x, 2.5);
  assert.strictEqual(res.vertex.y, -0.25);
  assert.strictEqual(res.steps.length, 5);
  assert.ok(res.graphData.points.length > 100);
  console.log('✔ Teste 1 passou: Δ > 0 (x^2 - 5x + 6 = 0 -> x1=2, x2=3)');
}

// Teste 2: Delta = 0 (uma raiz real dupla)
{
  const res = solveQuadraticEquation('x² - 4x + 4 = 0');
  assert.strictEqual(res.delta, 0);
  assert.strictEqual(res.hasRealRoots, true);
  assert.strictEqual(res.rootCount, 1);
  assert.strictEqual(res.roots.x1, 2);
  assert.strictEqual(res.roots.x2, 2);
  assert.strictEqual(res.vertex.x, 2);
  assert.strictEqual(res.vertex.y, 0);
  console.log('✔ Teste 2 passou: Δ = 0 (x² - 4x + 4 = 0 -> x=2)');
}

// Teste 3: Delta < 0 (sem raízes reais)
{
  const res = solveQuadraticEquation('x^2 + 2x + 5 = 0');
  assert.strictEqual(res.delta, -16);
  assert.strictEqual(res.hasRealRoots, false);
  assert.strictEqual(res.rootCount, 0);
  assert.strictEqual(res.roots.x1, null);
  assert.strictEqual(res.roots.x2, null);
  assert.strictEqual(res.vertex.x, -1);
  assert.strictEqual(res.vertex.y, 4);
  console.log('✔ Teste 3 passou: Δ < 0 (x^2 + 2x + 5 = 0 -> sem raízes reais)');
}

// Teste 4: Equação incompleta com termos nos dois lados
{
  const res = solveQuadraticEquation('2x^2 = 8');
  assert.strictEqual(res.delta, 64);
  assert.strictEqual(res.roots.x1, -2);
  assert.strictEqual(res.roots.x2, 2);
  console.log('✔ Teste 4 passou: Equação com termos em ambos os lados (2x^2 = 8 -> x1=-2, x2=2)');
}

// Teste 5: Validação de erro para a = 0
{
  let threw = false;
  try {
    solveQuadraticEquation('4x - 8 = 0');
  } catch (err) {
    threw = true;
    assert.strictEqual(err.code, 'NOT_QUADRATIC_EQUATION');
  }
  assert.strictEqual(threw, true);
  console.log('✔ Teste 5 passou: Rejeição correta quando coeficiente a = 0');
}

// Teste 6: Acessibilidade e Seletor de Modo Claro / Modo Escuro no Frontend
{
  const fs = require('node:fs');
  const path = require('node:path');
  const publicDir = path.join(__dirname, '..', 'public');

  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(publicDir, 'styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');

  assert.ok(html.includes('id="btn-theme-toggle"'), 'index.html deve conter o botão #btn-theme-toggle');
  assert.ok(html.includes('aria-pressed='), 'Botão de tema deve possuir atributo aria-pressed');
  assert.ok(html.includes('aria-label='), 'Botão de tema deve possuir atributo aria-label');
  assert.ok(css.includes('[data-theme="light"]'), 'styles.css deve definir variáveis para [data-theme="light"]');
  assert.ok(css.includes('.theme-toggle-btn'), 'styles.css deve estilizar .theme-toggle-btn');
  assert.ok(js.includes('equacoes_theme'), 'app.js deve persistir o tema em localStorage (equacoes_theme)');
  assert.ok(js.includes('getCanvasThemePalette'), 'app.js deve adaptar a paleta de cores do Canvas conforme o tema');
  console.log('✔ Teste 6 passou: Seletor de Modo Claro e Modo Escuro configurado com atributos de acessibilidade');
}

console.log('Todos os testes passaram com sucesso!');
