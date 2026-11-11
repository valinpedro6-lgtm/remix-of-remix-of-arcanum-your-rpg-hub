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

const SELECT = "id, name, map_url, tokens, grid, fog, zoom, last_roll, turn_order, active_turn, round, vision_mode, share_id, updated_at";
const validId = (s: string) => /^[a-zA-Z0-9_-]{4,64}$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const shareId = String(body.shareId ?? "").slice(0, 64);
    if (!validId(shareId)) return json({ board: null });

    // Jogador atualiza o mapa compartilhado: só os próprios bonecos e rolagens.
    // Névoa, mapa, grade e zoom NUNCA podem ser alterados por aqui.
    if (body.action === "shared-update") {
      const values: Record<string, unknown> = {};
      if (Array.isArray(body.tokens)) {
        values.tokens = body.tokens.slice(0, 200).map((t: Record<string, unknown>) => ({
          id: String(t.id ?? "").slice(0, 32),
          name: String(t.name ?? "").slice(0, 60),
          image: String(t.image ?? ""),
          x: Math.max(0, Math.min(100, Number(t.x) || 0)),
          y: Math.max(0, Math.min(100, Number(t.y) || 0)),
          size: Math.max(1, Math.min(40, Number(t.size) || 8)),
          rotation: Number(t.rotation) || 0,
          conditions: Array.isArray(t.conditions) ? t.conditions.slice(0, 12).map((c: Record<string, unknown>) => ({
            id: String(c.id ?? "").slice(0, 32),
            name: String(c.name ?? "").slice(0, 40),
            rounds: Math.max(1, Math.min(99, Number(c.rounds) || 1)),
          })).filter((c: { id: string; name: string }) => c.id && c.name) : [],
        })).filter((t: { id: string }) => t.id);
      }
      if (body.last_roll && typeof body.last_roll === "object") {
        const r = body.last_roll as Record<string, unknown>;
        values.last_roll = {
          expr: String(r.expr ?? "").slice(0, 30),
          total: Number(r.total) || 0,
          by: String(r.by ?? "").slice(0, 40),
          at: Number(r.at) || Date.now(),
        };
      }
      if (Object.keys(values).length === 0) return json({ ok: true });
      const { error } = await admin.from("tabletops").update(values).eq("share_id", shareId);
      if (error) throw error;
      return json({ ok: true });
    }

    // Sincronização incremental: o cliente informa a versão que já possui.
    // Assim, movimentos frequentes não retransmitem imagens e tokens inteiros.
    const since = String(body.since ?? "");
    if (since) {
      const { data: version } = await admin.from("tabletops").select("id, updated_at").eq("share_id", shareId).maybeSingle();
      if (!version) return json({ board: null });
      if (version.updated_at === since) return json({ unchanged: true, updated_at: version.updated_at });
    }
    const { data } = await admin.from("tabletops").select(SELECT).eq("share_id", shareId).maybeSingle();
    return json({ board: data ?? null });
  } catch (e) {
    console.error("shared-tabletop error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
