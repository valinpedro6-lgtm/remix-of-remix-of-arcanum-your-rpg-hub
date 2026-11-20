import type { Client } from 'pg';
import { asRecord, asString, HttpError, json } from './db';

const SHEET_FIELDS = [
  'kind', 'style', 'name', 'subtitle', 'origin', 'age', 'occupation', 'profile', 'background',
  'image_url', 'accent', 'attributes', 'skills', 'resources', 'abilities', 'level', 'xp', 'xp_goal',
  'initiative', 'notes', 'in_list', 'last_roll',
] as const;
const BOARD_FIELDS = [
  'name', 'map_url', 'tokens', 'grid', 'fog', 'zoom', 'camera', 'last_roll', 'turn_order',
  'active_turn', 'round', 'vision_mode',
] as const;
const TABLES = { sheets: SHEET_FIELDS, tabletops: BOARD_FIELDS } as const;
type DataTable = keyof typeof TABLES;

const JSON_FIELDS: Record<DataTable, ReadonlySet<string>> = {
  sheets: new Set(['style', 'attributes', 'skills', 'resources', 'abilities', 'last_roll']),
  tabletops: new Set(['tokens', 'fog', 'camera', 'last_roll', 'turn_order']),
};

function encodeJsonFields(table: DataTable, source: Record<string, unknown>) {
  const values = { ...source };
  for (const key of JSON_FIELDS[table]) {
    const value = values[key];
    if (value !== null && value !== undefined) values[key] = JSON.stringify(value);
  }
  return values;
}

const SHARED_EDIT_FIELDS = [
  'name', 'subtitle', 'origin', 'image_url', 'attributes', 'skills', 'resources', 'abilities',
  'notes', 'last_roll',
] as const;
const SHEET_PUBLIC_FIELDS = `id, kind, style, name, subtitle, origin, age, occupation, profile,
  background, image_url, accent, attributes, skills, resources, abilities, level, xp, xp_goal,
  initiative, notes, in_list, share_id, created_at, updated_at, last_roll`;

function pick(source: Record<string, unknown>, fields: readonly string[]) {
  const values: Record<string, unknown> = {};
  for (const key of fields) if (Object.prototype.hasOwnProperty.call(source, key)) values[key] = source[key];
  return values;
}

function strip<T extends Record<string, unknown> | null>(row: T): T {
  if (!row) return row;
  const { owner: _owner, edit_pin: _pin, ...rest } = row;
  return rest as T;
}

function safeRoll(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const roll = value as Record<string, unknown>;
  return {
    expr: asString(roll.expr).slice(0, 40),
    total: Math.max(-999, Math.min(999, Number(roll.total) || 0)),
    by: asString(roll.by).slice(0, 80),
    at: Number(roll.at) || Date.now(),
    detail: asString(roll.detail).slice(0, 120),
  };
}

async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function handleUserData(client: Client, body: Record<string, unknown>) {
  const action = asString(body.action);

  if (action === 'shared') {
    const shareId = asString(body.shareId).slice(0, 64);
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(shareId)) return json({ sheet: null });
    const result = await client.query(
      `SELECT ${SHEET_PUBLIC_FIELDS} FROM public.sheets WHERE share_id = $1 LIMIT 1`,
      [shareId],
    );
    return json({ sheet: result.rows[0] ?? null });
  }

  if (action === 'shared-update') {
    const shareId = asString(body.shareId).slice(0, 64);
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(shareId)) return json({ ok: false }, 400);
    let values = pick(asRecord(body.values), SHARED_EDIT_FIELDS);
    if ('last_roll' in values) values.last_roll = safeRoll(values.last_roll);
    values = encodeJsonFields('sheets', values);
    const keys = Object.keys(values);
    if (keys.length === 0) return json({ ok: true });
    const params = keys.map((key) => values[key]);
    const assignments = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    await client.query(`UPDATE public.sheets SET ${assignments} WHERE share_id = $${keys.length + 1}`, [...params, shareId]);
    return json({ ok: true });
  }

  const token = asString(body.token);
  if (token.length < 20 || token.length > 128) throw new HttpError(401, 'Sem identificação');
  const owner = await hashToken(token);

  if (action === 'claim') {
    const gate = await client.query<{ master_password: string }>(
      'SELECT master_password FROM public.access_gate WHERE id = 1',
    );
    if (!gate.rows[0] || asString(body.master).trim() !== gate.rows[0].master_password) {
      return json({ ok: false });
    }
    await client.query('UPDATE public.sheets SET owner = $1 WHERE owner IS NULL', [owner]);
    await client.query('UPDATE public.tabletops SET owner = $1 WHERE owner IS NULL', [owner]);
    return json({ ok: true });
  }

  const table = asString(body.table) as DataTable;
  const fields = TABLES[table];
  if (!fields) throw new HttpError(400, 'Tabela inválida');
  const id = asString(body.id);

  if (action === 'list') {
    const result = await client.query(
      `SELECT * FROM public.${table} WHERE owner = $1 ORDER BY created_at ASC`,
      [owner],
    );
    return json({ rows: result.rows.map((row) => strip(row)) });
  }

  if (action === 'create') {
    const values = encodeJsonFields(table, { ...pick(asRecord(body.values), fields), owner });
    const keys = Object.keys(values);
    const columns = keys.map((key) => `"${key}"`).join(', ');
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const result = await client.query(
      `INSERT INTO public.${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      keys.map((key) => values[key]),
    );
    return json({ row: strip(result.rows[0]) });
  }

  if (action === 'update') {
    let values = pick(asRecord(body.values), fields);
    if ('last_roll' in values) values.last_roll = safeRoll(values.last_roll);
    values = encodeJsonFields(table, values);
    const keys = Object.keys(values);
    if (!id || keys.length === 0) return json({ ok: true });
    const assignments = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    await client.query(
      `UPDATE public.${table} SET ${assignments}
        WHERE id = $${keys.length + 1} AND owner = $${keys.length + 2}`,
      [...keys.map((key) => values[key]), id, owner],
    );
    return json({ ok: true });
  }

  if (action === 'delete') {
    await client.query(`DELETE FROM public.${table} WHERE id = $1 AND owner = $2`, [id, owner]);
    return json({ ok: true });
  }

  throw new HttpError(400, 'Ação inválida');
}
