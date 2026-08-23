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

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const row = await getRow();
    if (!row) return json({ error: "Configuração de acesso não encontrada." }, 500);

    if (action === "verify") {
      const code = String(body.code ?? "").trim();
      if (!code || code.length > 64) return json({ ok: false }, 200);
      if (code === row.master_password) return json({ ok: true, master: true });
      if (code === row.current_code) return json({ ok: true, master: false });
      return json({ ok: false });
    }

    if (action === "master-status") {
      const master = String(body.master ?? "").trim();
      if (master !== row.master_password) return json({ ok: false }, 200);
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
