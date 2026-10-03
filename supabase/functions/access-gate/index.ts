import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** limites */
const MAX_FAILS = 5;              // tentativas antes do bloqueio
const BASE_LOCK_MIN = 5;          // duração do 1º bloqueio (minutos)
const MAX_LOCK_MIN = 120;         // teto do bloqueio

const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function hmac(msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha(msg: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
/** chave de dados: a mesma para o mesmo e-mail em qualquer aparelho */
const ownerTokenFor = (id: string) => hmac("owner:" + id);
/** ingresso curto entre o código e o e-mail (10 min) */
async function makeTicket(device: string) {
  const exp = Date.now() + 10 * 60_000;
  return `${exp}.${await hmac("ticket:" + device + ":" + exp)}`;
}
async function checkTicket(device: string, ticket: string) {
  const [exp, sig] = ticket.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sig === await hmac("ticket:" + device + ":" + exp);
}
/** passa fichas/mapas do token antigo deste aparelho para a conta */
async function adoptRows(oldToken: string, newToken: string) {
  if (!oldToken || oldToken.length < 20 || oldToken === newToken) return;
  const from = await sha(oldToken);
  const to = await sha(newToken);
  await admin.from("sheets").update({ owner: to }).eq("owner", from);
  await admin.from("tabletops").update({ owner: to }).eq("owner", from);
}

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "desconhecido";
  return ip.slice(0, 64);
}

async function getRow() {
  const { data, error } = await admin
    .from("access_gate")
    .select("master_password, current_code, code_updated_at, code_max_uses, code_uses_left")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getAttempts(ip: string) {
  const { data } = await admin
    .from("access_attempts")
    .select("ip, fails, strikes, locked_until")
    .eq("ip", ip)
    .maybeSingle();
  return data ?? { ip, fails: 0, strikes: 0, locked_until: null as string | null };
}

async function registerFail(ip: string) {
  const a = await getAttempts(ip);
  const fails = (a.fails ?? 0) + 1;
  let strikes = a.strikes ?? 0;
  let lockedUntil: string | null = null;

  if (fails >= MAX_FAILS) {
    strikes += 1;
    const minutes = Math.min(BASE_LOCK_MIN * Math.pow(2, strikes - 1), MAX_LOCK_MIN);
    lockedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
  }

  await admin.from("access_attempts").upsert({
    ip,
    fails: lockedUntil ? 0 : fails,
    strikes,
    locked_until: lockedUntil,
    updated_at: new Date().toISOString(),
  });

  return {
    remaining: lockedUntil ? 0 : Math.max(0, MAX_FAILS - fails),
    lockedUntil,
  };
}

async function touchSession(device: string, label = "") {
  if (!device) return;
  const now = new Date().toISOString();
  const { data } = await admin.from("access_sessions").select("device_id").eq("device_id", device).maybeSingle();
  if (data) {
    await admin.from("access_sessions")
      .update(label ? { last_seen: now, label } : { last_seen: now })
      .eq("device_id", device);
  } else {
    await admin.from("access_sessions").insert({ device_id: device, label, first_seen: now, last_seen: now });
  }
}

/** consome um uso; quando acabar, gera outro código com o mesmo limite */
async function consumeUse(row: { code_uses_left: number; code_max_uses: number }) {
  const left = (row.code_uses_left ?? 1) - 1;
  if (left > 0) {
    await admin.from("access_gate").update({ code_uses_left: left }).eq("id", 1);
    return;
  }
  await admin.from("access_gate")
    .update({ current_code: generateCode(), code_updated_at: new Date().toISOString(), code_uses_left: row.code_max_uses ?? 1 })
    .eq("id", 1);
}

async function stats() {
  const since = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data } = await admin
    .from("access_sessions")
    .select("device_id, label, first_seen, last_seen")
    .order("last_seen", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  return {
    total: rows.length,
    active: rows.filter((r) => r.last_seen > since).length,
    sessions: rows,
  };
}

async function clearAttempts(ip: string) {
  await admin.from("access_attempts")
    .upsert({ ip, fails: 0, strikes: 0, locked_until: null, updated_at: new Date().toISOString() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = clientKey(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const row = await getRow();
    if (!row) return json({ error: "Configuração de acesso não encontrada." }, 500);

    const guarded = action === "verify" || action === "master-status";

    if (guarded) {
      const a = await getAttempts(ip);
      if (a.locked_until && new Date(a.locked_until).getTime() > Date.now()) {
        const retryAfter = Math.ceil((new Date(a.locked_until).getTime() - Date.now()) / 1000);
        return json({ ok: false, locked: true, retryAfter, lockedUntil: a.locked_until });
      }
    }

    if (action === "verify") {
      const code = String(body.code ?? "").trim();
      if (!code || code.length > 64) {
        const r = await registerFail(ip);
        return json({ ok: false, ...r });
      }
      const device = String(body.device ?? "").slice(0, 64);
      if (code === row.master_password) {
        await clearAttempts(ip);
        await touchSession(device, "Mestre");
        const token = await ownerTokenFor("master");
        await adoptRows(String(body.oldToken ?? ""), token);
        return json({ ok: true, master: true, token });
      }
      if (code === row.current_code) {
        await clearAttempts(ip);
        await touchSession(device);
        await consumeUse(row);
        return json({ ok: true, master: false, ticket: await makeTicket(device) });
      }
      const r = await registerFail(ip);
      return json({ ok: false, ...r });
    }

    if (action === "master-status") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) {
        const r = await registerFail(ip);
        return json({ ok: false, ...r });
      }
      await clearAttempts(ip);
      const token = await ownerTokenFor("master");
      await adoptRows(String(body.oldToken ?? ""), token);
      return json({ ok: true, token, currentCode: row.current_code, maxUses: row.code_max_uses, usesLeft: row.code_uses_left, updatedAt: row.code_updated_at, ...(await stats()) });
    }

    if (action === "register") {
      const device = String(body.device ?? "").slice(0, 64);
      const email = String(body.email ?? "").trim().slice(0, 120);
      if (!device || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json({ ok: false, error: "E-mail inválido" });
      }
      if (!(await checkTicket(device, String(body.ticket ?? "")))) {
        return json({ ok: false, error: "Digite o código de acesso de novo." });
      }
      await touchSession(device, email);
      const token = await ownerTokenFor("email:" + email.toLowerCase());
      await adoptRows(String(body.oldToken ?? ""), token);
      return json({ ok: true, token });
    }

    if (action === "heartbeat") {
      const device = String(body.device ?? "").slice(0, 64);
      await touchSession(device);
      return json({ ok: true });
    }

    if (action === "stats") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
      return json({ ok: true, currentCode: row.current_code, maxUses: row.code_max_uses, usesLeft: row.code_uses_left, ...(await stats()) });
    }

    if (action === "reset-sessions") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
      await admin.from("access_sessions").delete().neq("device_id", "");
      return json({ ok: true, ...(await stats()) });
    }

    if (action === "set-code") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
      const raw = String(body.code ?? "").trim();
      const next = raw ? raw.slice(0, 32) : generateCode();
      const uses = Math.max(1, Math.min(1000, Math.floor(Number(body.uses ?? row.code_max_uses ?? 1)) || 1));
      const { error } = await admin
        .from("access_gate")
        .update({ current_code: next, code_updated_at: new Date().toISOString(), code_max_uses: uses, code_uses_left: uses })
        .eq("id", 1);
      if (error) throw error;
      return json({ ok: true, currentCode: next, maxUses: uses, usesLeft: uses });
    }

    if (action === "set-master") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
      const next = String(body.newMaster ?? "").trim();
      if (next.length < 4 || next.length > 64) return json({ ok: false, error: "Senha inválida" });
      const { error } = await admin.from("access_gate").update({ master_password: next }).eq("id", 1);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("access-gate error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
