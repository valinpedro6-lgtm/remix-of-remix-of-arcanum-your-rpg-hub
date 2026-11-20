import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { handleSharedTabletop } from '../src/sharedTabletop.ts';
import { handleUserData } from '../src/userData.ts';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

class FakeClient {
  calls = [];

  async query(sql, params = []) {
    this.calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
    if (sql.includes('SELECT tokens FROM public.tabletops')) {
      return { rows: [{ tokens: [{ id: 'token-1', name: 'Hero', x: 10, y: 20 }] }] };
    }
    if (sql.startsWith('INSERT INTO public.sheets')) return { rows: [{ id: 'sheet-1' }] };
    return { rows: [] };
  }
}

function parametersByField(call) {
  if (call.sql.startsWith('INSERT INTO public.sheets')) {
    const match = call.sql.match(/INSERT INTO public\.sheets \(([^)]+)\) VALUES/);
    assert.ok(match, `não foi possível interpretar os campos INSERT: ${call.sql}`);
    const names = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
    return Object.fromEntries(names.map((name, index) => [name, call.params[index]]));
  }
  const assignments = [...call.sql.matchAll(/"([^"]+)" = \$(\d+)/g)];
  assert.ok(assignments.length, `não foi possível interpretar os campos UPDATE: ${call.sql}`);
  return Object.fromEntries(assignments.map((item) => [item[1], call.params[Number(item[2]) - 1]]));
}

test('criação de ficha envia os campos jsonb como JSON, não como arrays PostgreSQL', async () => {
  const client = new FakeClient();
  const attributes = [{ id: 'agi', label: 'Agilidade', value: 1 }];
  const skills = [{ id: 'furtividade', name: 'Furtividade', value: 5 }];
  const resources = [{ id: 'pv', label: 'Vida', current: 12, max: 12, tone: 'life' }];
  const abilities = [{ id: 'a1', name: 'Talento', cost: '1 PE', description: 'Teste' }];
  const style = { system: 'ordemparanormal' };

  const response = await handleUserData(client, {
    action: 'create', table: 'sheets', token: 'owner-token-for-regression-test-123456',
    values: { kind: 'player', style, attributes, skills, resources, abilities, last_roll: null },
  });
  assert.equal(response.status, 200);

  const params = parametersByField(client.calls.find((call) => call.sql.startsWith('INSERT INTO public.sheets')));
  for (const [field, expected] of Object.entries({ style, attributes, skills, resources, abilities })) {
    assert.equal(typeof params[field], 'string', `${field} precisa ser serializado`);
    assert.deepEqual(JSON.parse(params[field]), expected);
  }
  assert.equal(params.last_roll, null);
});

test('edição de ficha serializa arrays e preserva null como SQL NULL', async () => {
  const client = new FakeClient();
  const attributes = [{ id: 'agi', label: 'Agilidade', value: 2 }];
  const response = await handleUserData(client, {
    action: 'update', table: 'sheets', id: 'sheet-1',
    token: 'owner-token-for-regression-test-123456',
    values: { attributes, last_roll: null },
  });
  assert.equal(response.status, 200);

  const params = parametersByField(client.calls.find((call) => call.sql.startsWith('UPDATE public.sheets')));
  assert.deepEqual(JSON.parse(params.attributes), attributes);
  assert.equal(params.last_roll, null);
});

test('atualização compartilhada do tabletop serializa tokens e rolagem como JSON', async () => {
  const client = new FakeClient();
  const response = await handleSharedTabletop(client, {
    action: 'shared-update', shareId: 'share-1234', tokenId: 'token-1',
    tokens: [{ id: 'token-1', x: 42, y: 57 }],
    last_roll: { expr: '1d20', total: 17, by: 'Jogador', at: 1 },
  });
  assert.equal(response.status, 200);

  const update = client.calls.find((call) => call.sql.startsWith('UPDATE public.tabletops'));
  const params = parametersByField(update);
  assert.deepEqual(JSON.parse(params.tokens), [{ id: 'token-1', name: 'Hero', x: 42, y: 57 }]);
  assert.deepEqual(JSON.parse(params.last_roll), { expr: '1d20', total: 17, by: 'Jogador', at: 1 });
});

test('atualização de ficha compartilhada continua persistindo arrays JSONB', async () => {
  const client = new FakeClient();
  const resources = [{ id: 'pv', label: 'Vida', current: 8, max: 12, tone: 'life' }];
  const response = await handleUserData(client, {
    action: 'shared-update', shareId: 'share-1234',
    values: {
      resources,
      last_roll: { expr: '1d20', total: 11, by: 'Jogador', at: 2, detail: '1d20 = 11' },
    },
  });
  assert.equal(response.status, 200);

  const params = parametersByField(client.calls.find((call) => call.sql.startsWith('UPDATE public.sheets')));
  assert.deepEqual(JSON.parse(params.resources), resources);
  assert.deepEqual(JSON.parse(params.last_roll), {
    expr: '1d20', total: 11, by: 'Jogador', at: 2, detail: '1d20 = 11',
  });
});

test('atualização normal de tabletop serializa todos os campos jsonb', async () => {
  const client = new FakeClient();
  const tokens = [{ id: 'token-1', name: 'Hero', x: 15, y: 25 }];
  const fog = [{ id: 'fog-1', x: 10, y: 15, w: 20, h: 25 }];
  const camera = { x: 0.4, y: 0.6 };
  const turn_order = ['token-1'];
  const response = await handleUserData(client, {
    action: 'update', table: 'tabletops', id: 'board-1',
    token: 'owner-token-for-regression-test-123456',
    values: { tokens, fog, camera, turn_order, last_roll: null },
  });
  assert.equal(response.status, 200);

  const params = parametersByField(client.calls.find((call) => call.sql.startsWith('UPDATE public.tabletops')));
  for (const [field, expected] of Object.entries({ tokens, fog, camera, turn_order })) {
    assert.deepEqual(JSON.parse(params[field]), expected);
  }
  assert.equal(params.last_roll, null);
});
