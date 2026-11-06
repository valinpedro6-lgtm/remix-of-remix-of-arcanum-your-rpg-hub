import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

async function hmac(message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function authorize(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !token) return null;
  const expected = await hmac("owner:email:" + email);
  return token === expected ? email : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const email = await authorize(body);
    if (!email) return json({ error: "Entre novamente com seu e-mail para acessar a Comunidade." }, 401);

    const action = String(body.action ?? "list");
    if (action === "list") {
      const topic = String(body.topic ?? "all").slice(0, 32);
      let query = admin.from("community_posts")
        .select("id,parent_id,username,topic,body,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(150);
      if (topic !== "all") query = query.eq("topic", topic);
      const { data, error } = await query;
      if (error) throw error;
      return json({ posts: data ?? [] });
    }

    if (action === "create") {
      const bodyText = String(body.body ?? "").trim();
      const topic = String(body.topic ?? "geral").slice(0, 32);
      const parentId = body.parentId ? String(body.parentId) : null;
      if (!bodyText || bodyText.length > 4000) return json({ error: "A mensagem precisa ter entre 1 e 4000 caracteres." }, 400);
      const { data, error } = await admin.from("community_posts").insert({ owner: email, username: email, topic, body: bodyText, parent_id: parentId }).select("id,parent_id,username,topic,body,created_at,updated_at").single();
      if (error) throw error;
      return json({ post: data });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      const { error } = await admin.from("community_posts").delete().eq("id", id).eq("owner", email);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("community error", error);
    return json({ error: "Não foi possível atualizar a Comunidade agora." }, 500);
  }
});
