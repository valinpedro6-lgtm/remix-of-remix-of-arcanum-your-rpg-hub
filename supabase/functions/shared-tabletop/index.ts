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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const shareId = String(body.shareId ?? "").slice(0, 64);
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(shareId)) return json({ board: null });

    // Jogador move o próprio boneco (não apaga névoa, não mexe no resto)
    if (body.action === "move-token") {
      const tokenId = String(body.tokenId ?? "").slice(0, 32);
      const x = Math.max(0, Math.min(100, Number(body.x)));
      const y = Math.max(0, Math.min(100, Number(body.y)));
      if (!tokenId || !Number.isFinite(x) || !Number.isFinite(y)) return json({ ok: false }, 400);
      const { data: row } = await admin.from("tabletops").select("tokens").eq("share_id", shareId).maybeSingle();
      if (!row) return json({ ok: false }, 404);
      const tokens = (row.tokens ?? []).map((t: any) => (t.id === tokenId ? { ...t, x, y } : t));
      await admin.from("tabletops").update({ tokens }).eq("share_id", shareId);
      return json({ ok: true });
    }

    const { data } = await admin
      .from("tabletops")
      .select("id, name, map_url, tokens, grid, fog, view, share_id, updated_at")
      .eq("share_id", shareId)
      .maybeSingle();
    return json({ board: data ?? null });
  } catch (e) {
    console.error("shared-tabletop error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
