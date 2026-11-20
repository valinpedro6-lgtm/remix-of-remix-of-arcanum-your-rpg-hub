#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = '/home/ubuntu/.private-backups/arcanum-supabase';
const MANIFEST_PATH = join(BACKUP_DIR, 'backup-manifest.txt');
const TABLES = [
  'sheets',
  'tabletops',
  'sheets_history',
  'tabletops_history',
  'access_gate',
  'access_attempts',
  'access_sessions',
];

const FILES = {
  'sheets.csv': {
    table: 'sheets',
    columns: ['id', 'kind', 'name', 'subtitle', 'origin', 'age', 'occupation', 'profile', 'background', 'image_url', 'accent', 'style', 'attributes', 'skills', 'resources', 'abilities', 'notes', 'in_list', 'share_id', 'edit_pin', 'owner', 'created_at', 'updated_at', 'last_roll', 'level', 'xp', 'xp_goal', 'initiative'],
  },
  'tabletops.csv': {
    table: 'tabletops',
    columns: ['id', 'name', 'map_url', 'tokens', 'grid', 'fog', 'share_id', 'zoom', 'last_roll', 'owner', 'created_at', 'updated_at', 'turn_order', 'active_turn', 'round', 'vision_mode', 'camera'],
  },
  'sheets_history_000_100.csv': { table: 'sheets_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'sheets_history_100_200.csv': { table: 'sheets_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'sheets_history_200_300.csv': { table: 'sheets_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'sheets_history_300_400.csv': { table: 'sheets_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'sheets_history_400_end.csv': { table: 'sheets_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'tabletops_history_000_100.csv': { table: 'tabletops_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'tabletops_history_100_200.csv': { table: 'tabletops_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'tabletops_history_200_end.csv': { table: 'tabletops_history', columns: ['history_id', 'row_id', 'owner', 'operation', 'snapshot', 'saved_at'] },
  'access_tables_private.csv': { table: null, columns: ['access_attempts', 'access_gate', 'access_sessions'], access: true },
};
const EXPECTED_ACCESS_COUNTS = { access_attempts: 46, access_gate: 1, access_sessions: 70 };

class CsvCounter {
  constructor(onRecord) {
    this.onRecord = onRecord;
    this.field = '';
    this.record = [];
    this.recordQuoted = [];
    this.fieldQuoted = false;
    this.inQuotes = false;
    this.quotePending = false;
    this.skipLf = false;
    this.seenAny = false;
    this.recordCount = 0;
  }

  feed(text) {
    for (let i = 0; i < text.length; i += 1) {
      let ch = text[i];
      if (this.skipLf) {
        this.skipLf = false;
        if (ch === '\n') continue;
      }
      if (this.quotePending) {
        this.quotePending = false;
        if (ch === '"') {
          this.field += '"';
          this.inQuotes = true;
          this.seenAny = true;
          continue;
        }
        this.inQuotes = false;
        i -= 1;
        continue;
      }
      if (this.inQuotes) {
        if (ch === '"') this.quotePending = true;
        else this.field += ch;
        this.seenAny = true;
        continue;
      }
      if (ch === '"' && this.field.length === 0) {
        this.inQuotes = true;
        this.fieldQuoted = true;
        this.seenAny = true;
      } else if (ch === ',') {
        this.record.push(this.field);
        this.recordQuoted.push(this.fieldQuoted);
        this.field = '';
        this.fieldQuoted = false;
        this.seenAny = true;
      } else if (ch === '\n' || ch === '\r') {
        this.finishRecord();
        if (ch === '\r') this.skipLf = true;
      } else {
        this.field += ch;
        this.seenAny = true;
      }
    }
  }

  finishRecord() {
    this.record.push(this.field);
    const quoted = [...this.recordQuoted, this.fieldQuoted];
    this.field = '';
    const complete = this.record;
    this.record = [];
    this.recordQuoted = [];
    this.fieldQuoted = false;
    this.seenAny = false;
    this.recordCount += 1;
    this.onRecord(complete, this.recordCount, quoted);
  }

  finish() {
    if (this.quotePending) {
      this.quotePending = false;
      this.inQuotes = false;
    }
    if (this.inQuotes) throw new Error('invalid CSV');
    if (this.seenAny || this.field.length > 0 || this.record.length > 0) this.finishRecord();
  }
}

function parseManifest(text) {
  const entries = new Map();
  let declaredTotal = null;
  let declaredFileCount = null;
  for (const line of text.split(/\r?\n/)) {
    const entry = line.match(/^([^\t]+)\t(\d+) bytes\t(\d+) CSV records\tSHA-256 ([0-9a-f]{64})$/);
    if (entry) {
      const [, name, size, records, hash] = entry;
      if (!Object.hasOwn(FILES, name) || entries.has(name)) throw new Error('invalid manifest');
      entries.set(name, { size: Number(size), records: Number(records), sha256: hash });
      continue;
    }
    const total = line.match(/^TOTAL\t(\d+) bytes\t(\d+) CSV files$/);
    if (total) {
      declaredTotal = Number(total[1]);
      declaredFileCount = Number(total[2]);
    }
  }
  if (entries.size !== Object.keys(FILES).length || declaredTotal === null || declaredFileCount !== entries.size) {
    throw new Error('invalid manifest');
  }
  const sum = [...entries.values()].reduce((acc, item) => acc + item.size, 0);
  if (sum !== declaredTotal) throw new Error('invalid manifest');
  return entries;
}

function safeJsonArrayCount(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('invalid private JSON');
  }
  if (!Array.isArray(parsed) || parsed.some((item) => item === null || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('invalid private JSON');
  }
  return parsed.length;
}

async function validateOne(name, manifestEntry) {
  const filePath = join(BACKUP_DIR, name);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size !== manifestEntry.size) throw new Error('backup size mismatch');

  const expected = FILES[name];
  const hash = createHash('sha256');
  let headerSeen = false;
  let privateCounts = null;
  const sourceNulls = {};
  const parser = new CsvCounter((row, recordNumber, quoted) => {
    if (!headerSeen) {
      headerSeen = true;
      if (row[0]?.charCodeAt(0) === 0xfeff) row[0] = row[0].slice(1);
      if (row.length !== expected.columns.length || row.some((column, index) => column !== expected.columns[index])) {
        throw new Error('CSV header mismatch');
      }
      return;
    }
    if (row.length !== expected.columns.length) throw new Error('CSV field count mismatch');
    if (expected.table) {
      for (let index = 0; index < row.length; index += 1) {
        if (row[index] === '' && !quoted[index]) {
          const column = expected.columns[index];
          const key = `${expected.table}.${column}`;
          sourceNulls[key] = (sourceNulls[key] || 0) + 1;
        }
      }
    }
    if (expected.access) {
      if (recordNumber !== 2) throw new Error('private CSV row count mismatch');
      const names = ['access_attempts', 'access_gate', 'access_sessions'];
      privateCounts = Object.fromEntries(names.map((key, index) => [key, safeJsonArrayCount(row[index])]));
      for (const key of names) {
        if (privateCounts[key] !== EXPECTED_ACCESS_COUNTS[key]) throw new Error('private JSON count mismatch');
      }
      const required = {
        access_attempts: ['ip', 'fails', 'strikes', 'updated_at'],
        access_gate: ['master_password', 'current_code', 'code_updated_at', 'code_max_uses', 'code_uses_left'],
        access_sessions: ['id', 'device_id', 'label', 'first_seen', 'last_seen'],
      };
      for (const table of names) {
        const records = JSON.parse(row[names.indexOf(table)]);
        for (const column of required[table]) {
          const missing = records.filter((record) => record[column] === null || record[column] === undefined).length;
          if (missing > 0) sourceNulls[`${table}.${column}`] = missing;
        }
      }
    }
  });

  const decoder = new StringDecoder('utf8');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
    parser.feed(decoder.write(chunk));
  }
  parser.feed(decoder.end());
  parser.finish();
  const digest = hash.digest('hex');
  if (!headerSeen || parser.recordCount - 1 !== manifestEntry.records || digest !== manifestEntry.sha256) {
    throw new Error('backup integrity mismatch');
  }
  if (expected.access && (manifestEntry.records !== 1 || !privateCounts)) throw new Error('private CSV row count mismatch');
  return { name, table: expected.table, records: manifestEntry.records, sha256: digest, privateCounts, sourceNulls };
}

async function validateBackup() {
  const manifestText = await (await import('node:fs/promises')).readFile(MANIFEST_PATH, 'utf8');
  const manifest = parseManifest(manifestText);
  const validated = [];
  for (const [name, expected] of manifest) validated.push(await validateOne(name, expected));
  return validated;
}

function aggregateTableCounts(validated) {
  const counts = Object.fromEntries(TABLES.map((table) => [table, 0]));
  for (const item of validated) {
    if (item.table) counts[item.table] += item.records;
    else Object.assign(counts, item.privateCounts);
  }
  return counts;
}

function logValidation(validated, counts) {
  for (const item of validated) {
    console.log(`HASH ${item.name} ${item.sha256}`);
    for (const [tableColumn, count] of Object.entries(item.sourceNulls || {})) {
      if (count > 0) console.log(`SOURCE NULL ${tableColumn} ${count}`);
    }
  }
  for (const table of TABLES) console.log(`COUNT ${table} ${counts[table]}`);
}

async function copyFile(client, filePath, target, columns) {
  const copyFrom = (await import('pg-copy-streams')).from;
  const statement = `COPY ${target} (${columns.join(', ')}) FROM STDIN WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`;
  await pipeline(createReadStream(filePath), client.query(copyFrom(statement)));
}

async function tableCount(client, table) {
  const result = await client.query(`SELECT count(*)::bigint AS n FROM public.${table}`);
  return Number(result.rows[0].n);
}

async function importIntoDatabase(validated, expectedCounts) {
  if (process.env.NEON_TARGET_LABEL !== 'arcanum-test' || !process.env.NEON_DATABASE_URL) {
    throw new Error('apply guard failed');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  let connected = false;
  let inTransaction = false;
  let stage = 'connect';
  try {
    await client.connect();
    connected = true;
    stage = 'begin';
    await client.query('BEGIN');
    inTransaction = true;
    stage = 'schema';
    await client.query({ text: await (await import('node:fs/promises')).readFile(join(HERE, 'schema.sql'), 'utf8') });

    stage = 'destination-check';
    for (const table of TABLES) {
      if (await tableCount(client, table) !== 0) throw new Error('destination not empty');
    }

    // Existing empty test schemas may already have history triggers installed.
    // Remove only the known triggers for the load; post-load.sql recreates them.
    await client.query('DROP TRIGGER IF EXISTS sheets_backup_history ON public.sheets');
    await client.query('DROP TRIGGER IF EXISTS tabletops_backup_history ON public.tabletops');

    stage = 'main-copy';
    for (const item of validated) {
      if (item.table === 'sheets' || item.table === 'tabletops') {
        stage = `copy-${item.table}`;
        await copyFile(client, join(BACKUP_DIR, item.name), `public.${item.table}`, FILES[item.name].columns);
      }
    }

    await client.query(`CREATE TEMP TABLE sheets_history_import (
      history_id bigint NOT NULL, row_id uuid NOT NULL, owner text,
      operation text NOT NULL, snapshot jsonb NOT NULL, saved_at timestamptz NOT NULL
    ) ON COMMIT DROP`);
    await client.query(`CREATE TEMP TABLE tabletops_history_import (
      history_id bigint NOT NULL, row_id uuid NOT NULL, owner text,
      operation text NOT NULL, snapshot jsonb NOT NULL, saved_at timestamptz NOT NULL
    ) ON COMMIT DROP`);

    stage = 'history-copy';
    for (const item of validated) {
      if (item.table === 'sheets_history' || item.table === 'tabletops_history') {
        await copyFile(client, join(BACKUP_DIR, item.name), `pg_temp.${item.table}_import`, FILES[item.name].columns);
      }
    }
    stage = 'history-insert';
    await client.query(`INSERT INTO public.sheets_history (history_id, row_id, owner, operation, snapshot, saved_at)
      OVERRIDING SYSTEM VALUE
      SELECT history_id, row_id, owner, operation, snapshot, saved_at
      FROM pg_temp.sheets_history_import`);
    await client.query(`INSERT INTO public.tabletops_history (history_id, row_id, owner, operation, snapshot, saved_at)
      OVERRIDING SYSTEM VALUE
      SELECT history_id, row_id, owner, operation, snapshot, saved_at
      FROM pg_temp.tabletops_history_import`);

    await client.query(`CREATE TEMP TABLE access_import_stage (
      access_attempts jsonb NOT NULL,
      access_gate jsonb NOT NULL,
      access_sessions jsonb NOT NULL
    ) ON COMMIT DROP`);
    const privateFile = validated.find((item) => item.name === 'access_tables_private.csv');
    await copyFile(client, join(BACKUP_DIR, privateFile.name), 'pg_temp.access_import_stage', FILES[privateFile.name].columns);
    stage = 'access-insert';
    await client.query(`INSERT INTO public.access_attempts (ip, fails, strikes, locked_until, updated_at)
      SELECT ip, fails, strikes, locked_until, updated_at
      FROM pg_temp.access_import_stage s,
      LATERAL jsonb_to_recordset(s.access_attempts) AS x(ip text, fails integer, strikes integer, locked_until timestamptz, updated_at timestamptz)`);
    await client.query(`INSERT INTO public.access_gate (id, master_password, current_code, code_updated_at, code_max_uses, code_uses_left, test_code, test_code_expires_at)
      SELECT id, master_password, current_code, code_updated_at, code_max_uses, code_uses_left, test_code, test_code_expires_at
      FROM pg_temp.access_import_stage s,
      LATERAL jsonb_to_recordset(s.access_gate) AS x(id integer, master_password text, current_code text, code_updated_at timestamptz, code_max_uses integer, code_uses_left integer, test_code text, test_code_expires_at timestamptz)`);
    await client.query(`INSERT INTO public.access_sessions (id, device_id, label, first_seen, last_seen)
      SELECT id, device_id, label, first_seen, last_seen
      FROM pg_temp.access_import_stage s,
      LATERAL jsonb_to_recordset(s.access_sessions) AS x(id uuid, device_id text, label text, first_seen timestamptz, last_seen timestamptz)`);

    stage = 'count-verify';
    for (const table of TABLES) {
      const actual = await tableCount(client, table);
      if (actual !== expectedCounts[table]) throw new Error('import count mismatch');
    }

    stage = 'post-load';
    await client.query({ text: await (await import('node:fs/promises')).readFile(join(HERE, 'post-load.sql'), 'utf8') });
    stage = 'commit';
    await client.query('COMMIT');
    inTransaction = false;
    for (const table of TABLES) console.log(`IMPORTED ${table} ${expectedCounts[table]}`);
  } catch (error) {
    if (connected && inTransaction) {
      try { await client.query('ROLLBACK'); } catch { /* Suppress potentially sensitive driver text. */ }
    }
    const code = error && typeof error === 'object' && 'code' in error
      && typeof error.code === 'string' && /^[A-Z0-9_]{2,16}$/.test(error.code)
      ? error.code
      : 'unclassified';
    const safeIdentifier = (value) => typeof value === 'string' && /^[a-z_][a-z0-9_]{0,62}$/i.test(value) ? value : null;
    const relation = safeIdentifier(error?.table);
    const column = safeIdentifier(error?.column);
    const constraint = safeIdentifier(error?.constraint);
    console.error(`DATABASE ERROR stage=${stage} code=${code}`
      + (relation ? ` relation=${relation}` : '')
      + (column ? ` column=${column}` : '')
      + (constraint ? ` constraint=${constraint}` : ''));
    throw new Error('database operation failed; details withheld');
  } finally {
    if (connected) {
      try { await client.end(); } catch { /* Suppress potentially sensitive driver text. */ }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
    console.error('Use no arguments for dry-run or exactly --apply.');
    process.exitCode = 2;
    return;
  }
  const apply = args.includes('--apply');
  if (apply && (process.env.NEON_TARGET_LABEL !== 'arcanum-test' || !process.env.NEON_DATABASE_URL)) {
    console.error('Apply blocked: NEON_TARGET_LABEL and NEON_DATABASE_URL are required.');
    process.exitCode = 2;
    return;
  }

  try {
    const validated = await validateBackup();
    const counts = aggregateTableCounts(validated);
    logValidation(validated, counts);
    if (!apply) {
      console.log('DRY-RUN OK (no database connection opened)');
      return;
    }
    await importIntoDatabase(validated, counts);
    console.log('APPLY OK');
  } catch {
    console.error('Validation/import failed; details withheld to protect backup and connection data.');
    process.exitCode = 1;
  }
}

await main();
