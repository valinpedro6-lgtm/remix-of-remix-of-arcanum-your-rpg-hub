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
    .select("master_password, current_code, code_updated_at")
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
      if (code === row.master_password) {
        await clearAttempts(ip);
        return json({ ok: true, master: true });
      }
      if (code === row.current_code) {
        await clearAttempts(ip);
        return json({ ok: true, master: false });
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
      return json({ ok: true, currentCode: row.current_code, updatedAt: row.code_updated_at });
    }

    if (action === "set-code") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
      const raw = String(body.code ?? "").trim();
      const next = raw ? raw.slice(0, 32) : generateCode();
      const { error } = await admin
        .from("access_gate")
        .update({ current_code: next, code_updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      return json({ ok: true, currentCode: next });
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
