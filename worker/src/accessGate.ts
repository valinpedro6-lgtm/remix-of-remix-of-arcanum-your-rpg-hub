import type { Client } from 'pg';
import { asString, HttpError, json, requireHmacSecret, type Env } from './db';

type GateRow = {
  master_password: string;
  current_code: string;
  code_updated_at: string;
  code_max_uses: number;
  code_uses_left: number;
  test_code: string | null;
  test_code_expires_at: string | null;
};

type AttemptRow = { ip: string; fails: number; strikes: number; locked_until: string | null };
const MAX_FAILS = 5;
const BASE_LOCK_MIN = 5;
const MAX_LOCK_MIN = 120;

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

async function hmac(env: Env, message: string) {
  const keyText = requireHmacSecret(env);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyText),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

async function sha(message: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message)));
}

const ownerTokenFor = (env: Env, id: string) => hmac(env, `owner:${id}`);

async function makeTicket(env: Env, device: string) {
  const expires = Date.now() + 10 * 60_000;
  return `${expires}.${await hmac(env, `ticket:${device}:${expires}`)}`;
}

async function checkTicket(env: Env, device: string, ticket: string) {
  const [expires, signature, ...extra] = ticket.split('.');
  if (!expires || !signature || extra.length || Number(expires) < Date.now()) return false;
  return signature === await hmac(env, `ticket:${device}:${expires}`);
}

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

export function clientKey(request: Request) {
  // Cloudflare overwrites CF-Connecting-IP at its edge; do not trust a client-supplied XFF first.
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'desconhecido';
  return ip.slice(0, 64);
}

async function getGate(client: Client): Promise<GateRow | null> {
  const result = await client.query<GateRow>(
    `SELECT master_password, current_code, code_updated_at, code_max_uses,
            code_uses_left, test_code, test_code_expires_at
       FROM public.access_gate WHERE id = 1`,
  );
  return result.rows[0] ?? null;
}

async function getAttempts(client: Client, ip: string): Promise<AttemptRow> {
  const result = await client.query<AttemptRow>(
    'SELECT ip, fails, strikes, locked_until FROM public.access_attempts WHERE ip = $1',
    [ip],
  );
  return result.rows[0] ?? { ip, fails: 0, strikes: 0, locked_until: null };
}

async function registerFail(client: Client, ip: string) {
  const result = await client.query<{ fails: number; strikes: number; locked_until: string | null }>(
    `INSERT INTO public.access_attempts AS attempts (ip, fails, strikes, locked_until, updated_at)
     VALUES ($1, 1, 0, NULL, now())
     ON CONFLICT (ip) DO UPDATE SET
       fails = CASE WHEN attempts.fails + 1 >= $2
                    THEN 0 ELSE attempts.fails + 1 END,
       strikes = CASE WHEN attempts.fails + 1 >= $2
                      THEN attempts.strikes + 1
                      ELSE attempts.strikes END,
       locked_until = CASE WHEN attempts.fails + 1 >= $2
         THEN now() + make_interval(mins => LEAST($4::numeric,
                    $3::numeric * power(2, attempts.strikes))::int)
         ELSE NULL END,
       updated_at = now()
     RETURNING fails, strikes, locked_until`,
    [ip, MAX_FAILS, BASE_LOCK_MIN, MAX_LOCK_MIN],
  );
  const attempt = result.rows[0];
  const lockedUntil = attempt.locked_until;
  const reachedLimit = lockedUntil !== null;
  return {
    remaining: reachedLimit ? 0 : Math.max(0, MAX_FAILS - attempt.fails),
    lockedUntil,
  };
}

async function clearAttempts(client: Client, ip: string) {
  await client.query(
    `INSERT INTO public.access_attempts (ip, fails, strikes, locked_until, updated_at)
     VALUES ($1, 0, 0, NULL, now())
     ON CONFLICT (ip) DO UPDATE SET fails = 0, strikes = 0,
       locked_until = NULL, updated_at = now()`,
    [ip],
  );
}

async function touchSession(client: Client, device: string, label = '') {
  if (!device) return;
  await client.query(
    `INSERT INTO public.access_sessions (device_id, label, first_seen, last_seen)
     VALUES ($1, $2, now(), now())
     ON CONFLICT (device_id) DO UPDATE SET
       last_seen = now(),
       label = CASE WHEN EXCLUDED.label <> '' THEN EXCLUDED.label
                    ELSE public.access_sessions.label END`,
    [device, label],
  );
}

async function adoptRows(client: Client, oldToken: string, newToken: string) {
  if (!oldToken || oldToken.length < 20 || oldToken === newToken) return;
  const from = await sha(oldToken);
  const to = await sha(newToken);
  await client.query('UPDATE public.sheets SET owner = $1 WHERE owner = $2', [to, from]);
  await client.query('UPDATE public.tabletops SET owner = $1 WHERE owner = $2', [to, from]);
}

async function stats(client: Client) {
  const since = new Date(Date.now() - 2 * 60_000).toISOString();
  const result = await client.query<{ device_id: string; label: string; first_seen: string; last_seen: string }>(
    `SELECT device_id, label, first_seen, last_seen
       FROM public.access_sessions ORDER BY last_seen DESC LIMIT 100`,
  );
  const sessions = result.rows;
  return {
    total: sessions.length,
    active: sessions.filter((row) => new Date(row.last_seen).getTime() > new Date(since).getTime()).length,
    sessions,
  };
}

async function consumeUse(client: Client, row: GateRow) {
  const left = (row.code_uses_left ?? 1) - 1;
  if (left > 0) {
    await client.query('UPDATE public.access_gate SET code_uses_left = $1 WHERE id = 1', [left]);
    return;
  }
  await client.query(
    `UPDATE public.access_gate SET current_code = $1, code_updated_at = now(),
       code_uses_left = $2 WHERE id = 1`,
    [generateCode(), row.code_max_uses ?? 1],
  );
}

export async function handleAccessGate(
  client: Client,
  env: Env,
  request: Request,
  body: Record<string, unknown>,
) {
  const ip = clientKey(request);
  const action = asString(body.action);

  await client.query('BEGIN');
  try {
    // Serialize code consumption and gate settings changes to avoid lost updates.
    const lockGate = action === 'verify' || action === 'set-code' || action === 'set-master' || action === 'set-test-code';
    const gateResult = await client.query<GateRow>(
      `SELECT master_password, current_code, code_updated_at, code_max_uses,
              code_uses_left, test_code, test_code_expires_at
         FROM public.access_gate WHERE id = 1${lockGate ? ' FOR UPDATE' : ''}`,
    );
    const row = gateResult.rows[0];
    if (!row) throw new HttpError(500, 'Configuração de acesso não encontrada.');

    const done = async (payload: unknown, status = 200) => {
      await client.query('COMMIT');
      return json(payload, status);
    };

    if (action === 'verify' || action === 'master-status') {
      const attempt = await getAttempts(client, ip);
      if (attempt.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
        const retryAfter = Math.ceil((new Date(attempt.locked_until).getTime() - Date.now()) / 1000);
        return await done({ ok: false, locked: true, retryAfter, lockedUntil: attempt.locked_until });
      }
    }

    if (action === 'verify') {
      const code = asString(body.code).trim();
      if (!code || code.length > 64) {
        return await done({ ok: false, ...(await registerFail(client, ip)) });
      }
      const device = asString(body.device).slice(0, 64);
      if (code === row.master_password) {
        await clearAttempts(client, ip);
        await touchSession(client, device, 'Mestre');
        const token = await ownerTokenFor(env, 'master');
        await adoptRows(client, asString(body.oldToken), token);
        return await done({ ok: true, master: true, token });
      }
      if (row.test_code && code === row.test_code && row.test_code_expires_at
          && new Date(row.test_code_expires_at).getTime() > Date.now()) {
        await clearAttempts(client, ip);
        await touchSession(client, device, 'Teste (5 min)');
        const token = await ownerTokenFor(env, `test:${device}`);
        return await done({ ok: true, master: false, test: true, token, accessUntil: Date.now() + 5 * 60_000 });
      }
      if (code === row.current_code) {
        await clearAttempts(client, ip);
        await touchSession(client, device);
        await consumeUse(client, row);
        return await done({ ok: true, master: false, ticket: await makeTicket(env, device) });
      }
      return await done({ ok: false, ...(await registerFail(client, ip)) });
    }

    if (action === 'master-status') {
      if (asString(body.master).trim() !== row.master_password) {
        return await done({ ok: false, ...(await registerFail(client, ip)) });
      }
      await clearAttempts(client, ip);
      const token = await ownerTokenFor(env, 'master');
      await adoptRows(client, asString(body.oldToken), token);
      return await done({
        ok: true,
        token,
        currentCode: row.current_code,
        maxUses: row.code_max_uses,
        usesLeft: row.code_uses_left,
        updatedAt: row.code_updated_at,
        ...(await stats(client)),
      });
    }

    if (action === 'register') {
      const device = asString(body.device).slice(0, 64);
      const email = asString(body.email).trim().slice(0, 120);
      if (!device || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return await done({ ok: false, error: 'E-mail inválido' });
      }
      if (!(await checkTicket(env, device, asString(body.ticket)))) {
        return await done({ ok: false, error: 'Digite o código de acesso de novo.' });
      }
      await touchSession(client, device, email);
      const token = await ownerTokenFor(env, `email:${email.toLowerCase()}`);
      await adoptRows(client, asString(body.oldToken), token);
      return await done({ ok: true, token });
    }

    if (action === 'heartbeat') {
      await touchSession(client, asString(body.device).slice(0, 64));
      return await done({ ok: true });
    }

    if (action === 'stats') {
      if (asString(body.master).trim() !== row.master_password) return await done({ ok: false });
      return await done({
        ok: true,
        currentCode: row.current_code,
        maxUses: row.code_max_uses,
        usesLeft: row.code_uses_left,
        testCode: row.test_code,
        testExpiresAt: row.test_code_expires_at,
        ...(await stats(client)),
      });
    }

    if (action === 'set-test-code') {
      if (asString(body.master).trim() !== row.master_password) return await done({ ok: false });
      let next = generateCode();
      while (next === row.current_code) next = generateCode();
      const expires = new Date(Date.now() + 5 * 60_000).toISOString();
      await client.query(
        'UPDATE public.access_gate SET test_code = $1, test_code_expires_at = $2 WHERE id = 1',
        [next, expires],
      );
      return await done({ ok: true, testCode: next, testExpiresAt: expires });
    }

    if (action === 'reset-sessions') {
      if (asString(body.master).trim() !== row.master_password) return await done({ ok: false });
      await client.query("DELETE FROM public.access_sessions WHERE device_id <> ''");
      return await done({ ok: true, ...(await stats(client)) });
    }

    if (action === 'set-code') {
      if (asString(body.master).trim() !== row.master_password) return await done({ ok: false });
      const raw = asString(body.code).trim();
      const next = raw ? raw.slice(0, 32) : generateCode();
      const uses = Math.max(1, Math.min(1000, Math.floor(Number(body.uses ?? row.code_max_uses ?? 1)) || 1));
      await client.query(
        `UPDATE public.access_gate SET current_code = $1, code_updated_at = now(),
           code_max_uses = $2, code_uses_left = $2 WHERE id = 1`,
        [next, uses],
      );
      return await done({ ok: true, currentCode: next, maxUses: uses, usesLeft: uses });
    }

    if (action === 'set-master') {
      if (asString(body.master).trim() !== row.master_password) return await done({ ok: false });
      const next = asString(body.newMaster).trim();
      if (next.length < 4 || next.length > 64) return await done({ ok: false, error: 'Senha inválida' });
      await client.query('UPDATE public.access_gate SET master_password = $1 WHERE id = 1', [next]);
      return await done({ ok: true });
    }

    return await done({ error: 'Ação inválida' }, 400);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}
