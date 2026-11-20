import { Client, types } from 'pg';

// Keep timestamptz values as their original PostgreSQL strings. Shared tabletop
// polling compares the exact version value returned by the previous request.
types.setTypeParser(1184, (value) => value);

type HyperdriveBinding = { connectionString: string };

export interface Env {
  HYPERDRIVE?: HyperdriveBinding;
  /** Local development only; production should use the Hyperdrive binding. */
  DATABASE_URL?: string;
  /** Must remain identical to the former Supabase HMAC input until owner migration is complete. */
  OWNER_HMAC_SECRET?: string;
  ALLOWED_ORIGINS?: string;
}

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export async function withDb<T>(env: Env, work: (client: Client) => Promise<T>): Promise<T> {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  if (!connectionString) throw new HttpError(503, 'Backend não configurado.');

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 8_000,
    query_timeout: 12_000,
  });

  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function requireHmacSecret(env: Env): string {
  if (!env.OWNER_HMAC_SECRET) throw new HttpError(503, 'Backend não configurado.');
  return env.OWNER_HMAC_SECRET;
}

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const asString = (value: unknown) => (value == null ? '' : String(value));
