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

console.log('Todos os testes passaram com sucesso!');
