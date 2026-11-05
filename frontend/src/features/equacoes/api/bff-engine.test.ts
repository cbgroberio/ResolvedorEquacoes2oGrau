import { describe, expect, it } from '@jest/globals';
import { EventEmitter } from 'node:events';

const {
  buildRuntimeConfig,
  handleRequest,
  resolveStaticFile,
} = require('../../../../server.js');
const { solveQuadraticEquation } = require('../../../../solverFallback.js');

function createMockRes() {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body = '';

  return {
    writeHead(code: number, hdrs?: Record<string, string>) {
      statusCode = code;
      if (hdrs) {
        headers = { ...headers, ...hdrs };
      }
    },
    end(chunk?: string) {
      if (chunk) {
        body += chunk;
      }
    },
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  };
}

describe('Motor Matemático de Fallback e Servidor BFF Node.js', () => {
  it('resolve equações com Δ > 0, Δ = 0, Δ < 0, a < 0 e incompletas', () => {
    const r1 = solveQuadraticEquation('x^2 - 5x + 6 = 0');
    expect(r1.delta).toBe(1);
    expect(r1.rootCount).toBe(2);
    expect(r1.roots.x1).toBe(2);
    expect(r1.roots.x2).toBe(3);

    const r2 = solveQuadraticEquation('x² - 4x + 4 = 0');
    expect(r2.delta).toBe(0);
    expect(r2.rootCount).toBe(1);
    expect(r2.roots.x1).toBe(2);

    const r3 = solveQuadraticEquation('x^2 + 2x + 5 = 0');
    expect(r3.delta).toBe(-16);
    expect(r3.hasRealRoots).toBe(false);
    expect(r3.roots.x1).toBeNull();

    const r4 = solveQuadraticEquation('-x^2 + 2x + 3 = 0');
    expect(r4.coefficients.a).toBe(-1);
    expect(r4.rootCount).toBe(2);

    const r5 = solveQuadraticEquation('2x^2 = 8');
    expect(r5.roots.x1).toBe(-2);
    expect(r5.roots.x2).toBe(2);
  });

  it('rejeita equações inválidas com códigos padronizados', () => {
    expect(() => solveQuadraticEquation('')).toThrow();
    expect(() => solveQuadraticEquation('4x - 8 = 0')).toThrow();
    expect(() => solveQuadraticEquation('x^3 + x^2 = 0')).toThrow();
    expect(() => solveQuadraticEquation('x^2 = 1 = 2')).toThrow();
    expect(() => solveQuadraticEquation('x^2 =')).toThrow();
    expect(() => solveQuadraticEquation('x^2 + + 2 = 0')).toThrow();
    expect(() => solveQuadraticEquation('x^2 - = 0')).toThrow();
    expect(() => solveQuadraticEquation('x^2 + abc = 0')).toThrow();
  });

  it('atende rotas do BFF (/healthz, /readyz, /config.json, OPTIONS, /api/404 e Path Traversal)', () => {
    process.env['SPA_CONFIG_JSON'] = '{"appName":"Teste BFF"}';
    expect(buildRuntimeConfig().appName).toBe('Teste BFF');
    process.env['SPA_CONFIG_JSON'] = '{invalido';
    expect(buildRuntimeConfig().apiBaseUrl).toBe('/api');
    delete process.env['SPA_CONFIG_JSON'];

    const traversal = resolveStaticFile('/../../etc/passwd');
    expect(traversal.forbidden).toBe(true);

    const healthRes = createMockRes();
    handleRequest(
      { method: 'GET', url: '/healthz', headers: { host: 'localhost' } },
      healthRes,
    );
    expect(healthRes.getStatus()).toBe(200);
    expect(JSON.parse(healthRes.getBody()).status).toBe('UP');

    const configRes = createMockRes();
    handleRequest(
      { method: 'GET', url: '/config.json', headers: { host: 'localhost' } },
      configRes,
    );
    expect(configRes.getStatus()).toBe(200);

    const optionsRes = createMockRes();
    handleRequest(
      { method: 'OPTIONS', url: '/api/v1/equations/solve', headers: {} },
      optionsRes,
    );
    expect(optionsRes.getStatus()).toBe(204);

    const api404Res = createMockRes();
    handleRequest(
      { method: 'GET', url: '/api/inexistente', headers: {} },
      api404Res,
    );
    expect(api404Res.getStatus()).toBe(404);
    expect(JSON.parse(api404Res.getBody()).type).toBe(
      'urn:equacoes:erro:nao-encontrado',
    );

    const openApiRes = createMockRes();
    handleRequest(
      { method: 'GET', url: '/openapi.yaml', headers: {} },
      openApiRes,
    );
    expect(openApiRes.getStatus()).toBe(200);

    const notFoundStaticRes = createMockRes();
    handleRequest(
      { method: 'GET', url: '/arquivo-que-nao-existe.xyz', headers: {} },
      notFoundStaticRes,
    );
    expect(notFoundStaticRes.getStatus()).toBe(404);
  });

  it('processa POST /api/v1/equations/solve com erro de validação retornando ProblemDetails 400', async () => {
    const reqEmitter = new EventEmitter() as EventEmitter & {
      method: string;
      url: string;
      headers: Record<string, string>;
      setEncoding: () => void;
    };
    reqEmitter.method = 'POST';
    reqEmitter.url = '/api/v1/equations/solve';
    reqEmitter.headers = { host: 'localhost' };
    reqEmitter.setEncoding = () => {
      /* no-op */
    };

    const res = createMockRes();
    const donePromise = new Promise<void>((resolve) => {
      const origEnd = res.end.bind(res);
      res.end = (chunk?: string) => {
        origEnd(chunk);
        resolve();
      };
    });

    handleRequest(reqEmitter, res);
    reqEmitter.emit('data', JSON.stringify({ equation: '4x - 8 = 0' }));
    reqEmitter.emit('end');

    await donePromise;
    expect(res.getStatus()).toBe(400);
    const body = JSON.parse(res.getBody());
    expect(body.codigoRegra).toBe('NOT_QUADRATIC_EQUATION');
  });
});

