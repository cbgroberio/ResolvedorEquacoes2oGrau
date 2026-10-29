const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { solveQuadraticEquation } = require('./solverFallback');

const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const PUBLIC_DIR = path.join(__dirname, 'public');
const OPENAPI_PATH = path.join(__dirname, '..', 'openapi', 'openapi.yaml');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

function forwardToJavaBackend(payloadStr) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL('/api/v1/equations/solve', BACKEND_URL);
    const req = http.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 8080,
        path: targetUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr, 'utf-8')
        },
        timeout: 2500
      },
      (res) => {
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 200, body: data });
        });
      }
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
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    ...extraHeaders
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Endpoint OpenAPI Specification
  if (req.method === 'GET' && (pathname === '/openapi.yaml' || pathname === '/api/v1/openapi.yaml')) {
    if (fs.existsSync(OPENAPI_PATH)) {
      const yamlContent = fs.readFileSync(OPENAPI_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/yaml; charset=utf-8' });
      res.end(yamlContent);
      return;
    }
  }

  // Endpoint de resolução OpenAPI: POST /api/v1/equations/solve
  if (req.method === 'POST' && pathname === '/api/v1/equations/solve') {
    let rawBody = '';
    req.setEncoding('utf-8');
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', async () => {
      try {
        // 1. Tenta encaminhar ao Backend Java 21 + Spring Boot 4 (porta 8080)
        try {
          const backendResp = await forwardToJavaBackend(rawBody);
          sendJson(res, backendResp.statusCode, backendResp.body, {
            'X-Engine': 'Java-21-SpringBoot-4'
          });
          return;
        } catch (_backendErr) {
          // 2. Caso o Backend Java não esteja ativo localmente, resolve mantendo 100% do contrato OpenAPI
          const parsedBody = rawBody ? JSON.parse(rawBody) : {};
          const result = solveQuadraticEquation(parsedBody.equation);
          sendJson(res, 200, result, {
            'X-Engine': 'OpenAPI-Node-Engine'
          });
        }
      } catch (err) {
        sendJson(res, 400, {
          code: err.code || 'INVALID_EQUATION',
          message: err.message || 'Equação inválida.',
          details: err.details || 'Use o formato ax^2 + bx + c = 0.'
        });
      }
    });
    return;
  }

  // Arquivos estáticos do Frontend
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

  // Prevenção de Path Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - Recurso não encontrado');
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Frontend Node.js] Servidor rodando em http://localhost:${PORT}`);
    console.log(`[OpenAPI Contract] Disponível em http://localhost:${PORT}/openapi.yaml`);
    console.log(`[Backend Target]   Encaminhando /api/v1/equations/solve para ${BACKEND_URL}`);
  });
}

module.exports = { server };
