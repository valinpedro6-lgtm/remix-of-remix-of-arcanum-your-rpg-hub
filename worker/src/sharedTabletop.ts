import type { Client } from 'pg';
import { asString, json } from './db';

const SELECT = `id, name, map_url, tokens, grid, fog, zoom, camera, last_roll,
  turn_order, active_turn, round, vision_mode, share_id, updated_at`;
const validId = (value: string) => /^[a-zA-Z0-9_-]{4,64}$/.test(value);
const jsonParam = (value: unknown) => value === null || value === undefined ? value : JSON.stringify(value);

export async function handleSharedTabletop(client: Client, body: Record<string, unknown>) {
  const shareId = asString(body.shareId).slice(0, 64);
  if (!validId(shareId)) return json({ board: null });

  if (body.action === 'shared-update') {
    const tokenId = asString(body.tokenId).slice(0, 32);
    const values: Record<string, unknown> = {};

    if (Array.isArray(body.tokens) && tokenId) {
      await client.query('BEGIN');
      try {
        const result = await client.query<{ tokens: unknown }>(
          'SELECT tokens FROM public.tabletops WHERE share_id = $1 FOR UPDATE',
          [shareId],
        );
        const currentTokens = Array.isArray(result.rows[0]?.tokens)
          ? result.rows[0].tokens as Record<string, unknown>[]
          : [];
        const requested = body.tokens.find((item) =>
          typeof item === 'object' && item !== null && String((item as Record<string, unknown>).id ?? '') === tokenId,
        ) as Record<string, unknown> | undefined;
        if (requested) {
          values.tokens = currentTokens.map((token) => token.id === tokenId
            ? {
                ...token,
                x: Math.max(0, Math.min(100, Number(requested.x) || 0)),
                y: Math.max(0, Math.min(100, Number(requested.y) || 0)),
              }
            : token);
        }
        if (body.last_roll && typeof body.last_roll === 'object' && !Array.isArray(body.last_roll)) {
          const roll = body.last_roll as Record<string, unknown>;
          values.last_roll = {
            expr: asString(roll.expr).slice(0, 30),
            total: Number(roll.total) || 0,
            by: asString(roll.by).slice(0, 40),
            at: Number(roll.at) || Date.now(),
          };
        }
        const keys = Object.keys(values);
        if (keys.length > 0) {
          const assignments = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
          await client.query(
            `UPDATE public.tabletops SET ${assignments} WHERE share_id = $${keys.length + 1}`,
            [...keys.map((key) => jsonParam(values[key])), shareId],
          );
        }
        await client.query('COMMIT');
        return json({ ok: true });
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      }
    }

    if (body.last_roll && typeof body.last_roll === 'object' && !Array.isArray(body.last_roll)) {
      const roll = body.last_roll as Record<string, unknown>;
      values.last_roll = {
        expr: asString(roll.expr).slice(0, 30),
        total: Number(roll.total) || 0,
        by: asString(roll.by).slice(0, 40),
        at: Number(roll.at) || Date.now(),
      };
    }
    if (Object.keys(values).length === 0) return json({ ok: true });
    const keys = Object.keys(values);
    const assignments = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    await client.query(
      `UPDATE public.tabletops SET ${assignments} WHERE share_id = $${keys.length + 1}`,
      [...keys.map((key) => jsonParam(values[key])), shareId],
    );
    return json({ ok: true });
  }

  const since = asString(body.since);
  if (since) {
    const result = await client.query<{ unchanged: boolean }>(
      `SELECT updated_at = $2::timestamptz AS unchanged
         FROM public.tabletops WHERE share_id = $1 LIMIT 1`,
      [shareId, since],
    );
    if (!result.rows[0]) return json({ board: null });
    if (result.rows[0].unchanged) return json({ unchanged: true, updated_at: since });
  }

  const result = await client.query(
    `SELECT ${SELECT} FROM public.tabletops WHERE share_id = $1 LIMIT 1`,
    [shareId],
  );
  return json({ board: result.rows[0] ?? null });
}
