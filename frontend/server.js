const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { solveQuadraticEquation } = require('./solverFallback');

const DEFAULT_PORT = 3000;
const DEFAULT_BACKEND_PORT = 8080;
const BACKEND_TIMEOUT_MS = 2500;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${DEFAULT_BACKEND_PORT}`;
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
const OPENAPI_PATH = path.join(__dirname, '..', 'openapi', 'openapi.yaml');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; connect-src 'self'",
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

function forwardToJavaBackend(payloadStr) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL('/api/v1/equations/solve', BACKEND_URL);
    const req = http.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || DEFAULT_BACKEND_PORT,
        path: targetUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr, 'utf-8'),
        },
        timeout: BACKEND_TIMEOUT_MS,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || HTTP_OK, body: data });
        });
      },
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout connecting to Java Backend'));
    });

    req.write(payloadStr);
    req.end();
  });
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  let payload = data;
  if (typeof data !== 'string') {
    payload = JSON.stringify(data);
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  res.end(payload);
}

function sendProblemDetails(res, statusCode, problem) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/problem+json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    ...SECURITY_HEADERS,
  });
  res.end(JSON.stringify(problem));
}

function buildRuntimeConfig() {
  const rawEnv = process.env.SPA_CONFIG_JSON;
  if (rawEnv && rawEnv.trim().length > 0) {
    try {
      return JSON.parse(rawEnv);
    } catch {
      /* Retorna configuração padrão se a variável estiver malformada */
    }
  }
  return {
    appName: 'Resolvedor de Equações do 2º Grau',
    apiBaseUrl: '/api',
    environment: 'production',
  };
}

function handleSolveEndpoint(req, res) {
  let rawBody = '';
  req.setEncoding('utf-8');
  req.on('data', (chunk) => {
    rawBody += chunk;
  });
  req.on('end', async () => {
    try {
      try {
        const backendResp = await forwardToJavaBackend(rawBody);
        sendJson(res, backendResp.statusCode, backendResp.body, {
          'X-Engine': 'Java-21-SpringBoot-4',
        });
        return;
      } catch {
        let parsedBody = {};
        if (rawBody) {
          parsedBody = JSON.parse(rawBody);
        }
        const result = solveQuadraticEquation(parsedBody.equation);
        sendJson(res, HTTP_OK, result, {
          'X-Engine': 'OpenAPI-Node-Engine',
        });
      }
    } catch (err) {
      const code = err.code || 'INVALID_EQUATION';
      const message = err.message || 'Equação inválida.';
      const details = err.details || 'Use o formato ax^2 + bx + c = 0.';

      sendProblemDetails(res, HTTP_BAD_REQUEST, {
        type: 'urn:equacoes:erro:validacao',
        title: 'Equação inválida',
        status: HTTP_BAD_REQUEST,
        detail: message,
        traceId: `bff-${Date.now()}`,
        codigoRegra: code,
        dadosApoio: { details },
        code,
        message,
        details,
      });
    }
  });
}

function resolveStaticFile(pathname) {
  let relativeTarget = pathname.slice(1);
  if (pathname === '/') {
    relativeTarget = 'index.html';
  }
  const distCandidate = path.resolve(DIST_DIR, relativeTarget);
  const publicCandidate = path.resolve(PUBLIC_DIR, relativeTarget);

  const isInsideDist = distCandidate.startsWith(DIST_DIR);
  const isInsidePublic = publicCandidate.startsWith(PUBLIC_DIR);

  if (!isInsideDist || !isInsidePublic) {
    return { forbidden: true, filePath: null };
  }

  if (fs.existsSync(distCandidate) && fs.statSync(distCandidate).isFile()) {
    return { forbidden: false, filePath: distCandidate };
  }

  if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
    return { forbidden: false, filePath: publicCandidate };
  }

  return { forbidden: false, filePath: null };
}

function handleRequest(req, res) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(HTTP_NO_CONTENT, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-XSRF-TOKEN',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (pathname === '/healthz' || pathname === '/readyz')) {
    sendJson(res, HTTP_OK, { status: 'UP' });
    return;
  }

  if (req.method === 'GET' && pathname === '/config.json') {
    sendJson(res, HTTP_OK, buildRuntimeConfig(), {
      'Cache-Control': 'no-store',
    });
    return;
  }

  if (
    req.method === 'GET' &&
    (pathname === '/openapi.yaml' || pathname === '/api/v1/openapi.yaml') &&
    fs.existsSync(OPENAPI_PATH)
  ) {
    const yamlContent = fs.readFileSync(OPENAPI_PATH, 'utf-8');
    res.writeHead(HTTP_OK, {
      'Content-Type': 'text/yaml; charset=utf-8',
      ...SECURITY_HEADERS,
    });
    res.end(yamlContent);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/v1/equations/solve') {
    handleSolveEndpoint(req, res);
    return;
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    sendProblemDetails(res, HTTP_NOT_FOUND, {
      type: 'urn:equacoes:erro:nao-encontrado',
      title: 'Recurso não encontrado',
      status: HTTP_NOT_FOUND,
      detail: `Endpoint ${pathname} não encontrado no BFF.`,
      traceId: 'bff-404',
    });
    return;
  }

  const resolved = resolveStaticFile(pathname);
  if (resolved.forbidden) {
    res.writeHead(HTTP_FORBIDDEN, SECURITY_HEADERS);
    res.end('Forbidden');
    return;
  }

  if (resolved.filePath) {
    const ext = path.extname(resolved.filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    let cacheHeader = 'public, max-age=3600';
    if (ext === '.html') {
      cacheHeader = 'no-store';
    }
    res.writeHead(HTTP_OK, {
      'Content-Type': contentType,
      'Cache-Control': cacheHeader,
      ...SECURITY_HEADERS,
    });
    fs.createReadStream(resolved.filePath).pipe(res);
    return;
  }

  res.writeHead(HTTP_NOT_FOUND, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...SECURITY_HEADERS,
  });
  res.end('404 - Recurso não encontrado');
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(
      `[Frontend BFF Node.js] Servidor rodando em http://localhost:${PORT}\n`,
    );
  });
}

module.exports = {
  server,
  buildRuntimeConfig,
  resolveStaticFile,
  handleRequest,
};
