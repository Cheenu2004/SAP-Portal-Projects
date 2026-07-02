#!/usr/bin/env node

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

loadLocalEnv();

const targetBaseUrl = process.env.SAP_TARGET_URL || 'http://AZKTLDS5CP.kcloud.com:8000';
const listenPort = Number(process.env.SAP_PROXY_PORT || 8080);
const sapBasicUser = process.env.SAP_BASIC_USER || 'K902065';
const sapBasicPassword = process.env.SAP_BASIC_PASSWORD || 'Srini@0611';
const target = new URL(targetBaseUrl);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization,Content-Type,Accept,X-Requested-With,X-CSRF-Token',
  'Access-Control-Expose-Headers': 'X-CSRF-Token,Location,Content-Length,Content-Type',
  'Access-Control-Max-Age': '86400',
};

const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const csrfMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue
      .replace(/^"([\s\S]*)"$/, '$1')
      .replace(/^'([\s\S]*)'$/, '$1');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function withCors(headers = {}) {
  return { ...headers, ...corsHeaders };
}

function buildUpstreamHeaders(clientHeaders = {}) {
  const headers = {};
  for (const [name, value] of Object.entries(clientHeaders)) {
    if (!hopByHopHeaders.has(name.toLowerCase())) {
      headers[name] = value;
    }
  }
  headers.host = target.host;
  if (sapBasicUser || sapBasicPassword) {
    const credentials = Buffer
      .from(`${sapBasicUser}:${sapBasicPassword}`, 'utf8')
      .toString('base64');
    headers.authorization = `Basic ${credentials}`;
  }
  return headers;
}

function getServiceRootPath(requestUrl) {
  const match = requestUrl.match(/^(.*\/[^/?]+_SRV)(?:\/|\?|$)/i);
  return match ? `${match[1]}/` : '/sap/opu/odata/sap/';
}

function fetchCsrfContext(requestUrl) {
  return new Promise((resolve, reject) => {
    const headers = buildUpstreamHeaders({
      accept: 'application/json',
      'x-csrf-token': 'Fetch',
    });

    const csrfReq = http.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 80,
        method: 'GET',
        path: getServiceRootPath(requestUrl),
        headers,
      },
      (csrfRes) => {
        csrfRes.resume();
        csrfRes.on('end', () => {
          resolve({
            token: csrfRes.headers['x-csrf-token'],
            cookies: csrfRes.headers['set-cookie'] || [],
          });
        });
      },
    );

    csrfReq.on('error', reject);
    csrfReq.end();
  });
}

async function proxyRequest(clientReq, clientRes) {
  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(204, withCors());
    clientRes.end();
    return;
  }

  if (!clientReq.url.startsWith('/sap/')) {
    clientRes.writeHead(404, withCors({ 'Content-Type': 'text/plain' }));
    clientRes.end('Only /sap/* requests are proxied to SAP Gateway.');
    return;
  }

  const headers = buildUpstreamHeaders(clientReq.headers);

  if (
    csrfMethods.has(clientReq.method) &&
    !headers['x-csrf-token'] &&
    !headers['X-CSRF-Token']
  ) {
    try {
      const csrf = await fetchCsrfContext(clientReq.url);
      if (csrf.token) {
        headers['x-csrf-token'] = csrf.token;
      }
      if (csrf.cookies.length > 0) {
        headers.cookie = csrf.cookies
          .map((cookie) => cookie.split(';')[0])
          .join('; ');
      }
    } catch (error) {
      clientRes.writeHead(502, withCors({ 'Content-Type': 'text/plain' }));
      clientRes.end(`Could not fetch SAP CSRF token: ${error.message}`);
      return;
    }
  }

  const upstreamReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 80,
      method: clientReq.method,
      path: clientReq.url,
      headers,
    },
    (upstreamRes) => {
      const responseHeaders = {};
      for (const [name, value] of Object.entries(upstreamRes.headers)) {
        if (!hopByHopHeaders.has(name.toLowerCase())) {
          responseHeaders[name] = value;
        }
      }

      clientRes.writeHead(
        upstreamRes.statusCode || 502,
        withCors(responseHeaders),
      );
      upstreamRes.pipe(clientRes);
    },
  );

  upstreamReq.on('error', (error) => {
    clientRes.writeHead(502, withCors({ 'Content-Type': 'text/plain' }));
    clientRes.end(`Could not reach SAP Gateway: ${error.message}`);
  });

  clientReq.pipe(upstreamReq);
}

http.createServer(proxyRequest).listen(listenPort, () => {
  console.log(`SAP proxy listening on http://localhost:${listenPort}`);
  console.log(`Forwarding /sap/* to ${targetBaseUrl}`);
  console.log(
    sapBasicUser
      ? `Using SAP Basic Auth user ${sapBasicUser}`
      : 'No SAP Basic Auth user configured',
  );
});
