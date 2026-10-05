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

const SHEET_FIELDS = [
  "kind", "style", "name", "subtitle", "origin", "image_url", "accent",
  "attributes", "skills", "resources", "abilities", "notes", "in_list",
];
const BOARD_FIELDS = ["name", "map_url", "tokens", "grid", "fog", "view"];
const TABLES: Record<string, string[]> = { sheets: SHEET_FIELDS, tabletops: BOARD_FIELDS };

const pick = (obj: Record<string, unknown>, fields: string[]) => {
  const out: Record<string, unknown> = {};
  for (const k of fields) if (obj && k in obj) out[k] = obj[k];
  return out;
};

const strip = (row: Record<string, unknown> | null) => {
  if (!row) return row;
  const { owner: _o, edit_pin: _p, ...rest } = row;
  return rest;
};

/** campos que o jogador pode editar pelo link da ficha */
const SHARED_EDIT_FIELDS = ["name", "subtitle", "origin", "image_url", "attributes", "skills", "resources", "abilities", "notes", "style"];

async function hashToken(token: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    // Página pública do jogador: só a ficha daquele link
    if (action === "shared") {
      const shareId = String(body.shareId ?? "").slice(0, 64);
      if (!/^[a-zA-Z0-9_-]{4,64}$/.test(shareId)) return json({ sheet: null });
      const { data } = await admin.from("sheets").select("*").eq("share_id", shareId).maybeSingle();
      return json({ sheet: strip(data) });
    }

    // Jogador edita a própria ficha pelo link compartilhado
    if (action === "shared-update") {
      const shareId = String(body.shareId ?? "").slice(0, 64);
      if (!/^[a-zA-Z0-9_-]{4,64}$/.test(shareId)) return json({ ok: false }, 400);
      const values = pick(body.values ?? {}, SHARED_EDIT_FIELDS);
      if (Object.keys(values).length === 0) return json({ ok: true });
      const { error } = await admin.from("sheets").update(values).eq("share_id", shareId);
      if (error) throw error;
      return json({ ok: true });
    }

    const token = String(body.token ?? "");
    if (token.length < 20 || token.length > 128) return json({ error: "Sem identificação" }, 401);
    const owner = await hashToken(token);

    // Mestre assume os dados antigos (criados antes da separação)
    if (action === "claim") {
      const master = String(body.master ?? "").trim();
      const { data: gate } = await admin.from("access_gate").select("master_password").eq("id", 1).maybeSingle();
      if (!gate || master !== gate.master_password) return json({ ok: false });
      await admin.from("sheets").update({ owner }).is("owner", null);
      await admin.from("tabletops").update({ owner }).is("owner", null);
      return json({ ok: true });
    }

    const table = String(body.table ?? "");
    const fields = TABLES[table];
    if (!fields) return json({ error: "Tabela inválida" }, 400);
    const id = String(body.id ?? "");

    if (action === "list") {
      const { data, error } = await admin.from(table).select("*").eq("owner", owner).order("created_at", { ascending: true });
      if (error) throw error;
      return json({ rows: (data ?? []).map(strip) });
    }

    if (action === "create") {
      const values = { ...pick(body.values ?? {}, fields), owner };
      const { data, error } = await admin.from(table).insert(values).select().single();
      if (error) throw error;
      return json({ row: strip(data) });
    }

    if (action === "update") {
      const values = pick(body.values ?? {}, fields);
      if (!id || Object.keys(values).length === 0) return json({ ok: true });
      const { error } = await admin.from(table).update(values).eq("id", id).eq("owner", owner);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const { error } = await admin.from(table).delete().eq("id", id).eq("owner", owner);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("user-data error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
