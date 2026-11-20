import { handleAccessGate } from './accessGate';
import { asRecord, HttpError, json, withDb, type Env } from './db';
import { handleSharedTabletop } from './sharedTabletop';
import { handleUserData } from './userData';

const DEFAULT_ORIGINS = ['https://arcanumrpg.vercel.app'];

function allowedOrigins(env: Env) {
  const configured = env.ALLOWED_ORIGINS?.split(',').map((item) => item.trim()).filter(Boolean);
  return new Set(configured?.length ? configured : DEFAULT_ORIGINS);
}

function withCors(response: Response, origin: string | null, allowed: Set<string>) {
  const headers = new Headers(response.headers);
  headers.set('Vary', 'Origin');
  headers.set('Cache-Control', 'no-store');
  if (origin && allowed.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'content-type, authorization, apikey, x-client-info');
    headers.set('Access-Control-Max-Age', '600');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function functionName(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.at(-1) ?? '';
}

async function dispatch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const origins = allowedOrigins(env);

  if (url.pathname === '/health' && (request.method === 'GET' || request.method === 'HEAD')) {
    return withCors(new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }), origin, origins);
  }

  if (origin && !origins.has(origin)) {
    return json({ error: 'Origem não permitida' }, 403);
  }
  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }), origin, origins);
  }
  if (request.method !== 'POST') return withCors(json({ error: 'Método não permitido' }, 405), origin, origins);

  let body: Record<string, unknown>;
  try {
    body = asRecord(await request.json());
  } catch {
    return withCors(json({ error: 'JSON inválido' }, 400), origin, origins);
  }

  try {
    const name = functionName(url.pathname);
    const response = await withDb(env, async (client) => {
      if (name === 'access-gate') return handleAccessGate(client, env, request, body);
      if (name === 'user-data') return handleUserData(client, body);
      if (name === 'shared-tabletop') return handleSharedTabletop(client, body);
      throw new HttpError(404, 'Endpoint não encontrado.');
    });
    return withCors(response, origin, origins);
  } catch (error) {
    if (error instanceof HttpError) return withCors(json({ error: error.message }, error.status), origin, origins);
    // Do not log SQL messages or request values: they can contain user data.
    console.error('arcanum-api error', error instanceof Error ? error.name : 'UnknownError');
    return withCors(json({ error: 'Erro interno' }, 500), origin, origins);
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return dispatch(request, env);
  },
};
