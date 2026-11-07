import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "arcanum-library";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const masterPassword = async () => {
  const { data, error } = await admin.from("access_gate").select("master_password").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data?.master_password ?? "";
};
const validPlayerToken = (value: unknown) => {
  const token = String(value ?? "");
  return token.length >= 20 && token.length <= 128;
};
const validMaster = async (value: unknown) => String(value ?? "").trim() === await masterPassword();
const cleanName = (value: string) => value.replace(/[^a-zA-Z0-9À-ÿ._ -]/g, "").trim().slice(0, 140) || "livro.pdf";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method === "POST" && (req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      if (!await validMaster(form.get("master"))) return json({ error: "Apenas o mestre pode publicar na Biblioteca." }, 403);
      const file = form.get("file");
      if (!(file instanceof File) || file.type !== "application/pdf") return json({ error: "Envie um arquivo PDF." }, 400);
      if (file.size > 50 * 1024 * 1024) return json({ error: "O PDF precisa ter no máximo 50 MB." }, 400);
      const title = String(form.get("title") ?? file.name.replace(/\.pdf$/i, "")).trim().slice(0, 120) || "Livro sem título";
      const path = `${crypto.randomUUID()}-${cleanName(file.name)}`;
      const upload = await admin.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw upload.error;
      const { data, error } = await admin.from("master_library").insert({ title, file_name: file.name.slice(0, 180), storage_path: path, mime_type: "application/pdf", size_bytes: file.size }).select("id,title,file_name,size_bytes,created_at").single();
      if (error) { await admin.storage.from(BUCKET).remove([path]); throw error; }
      return json({ item: data });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    if (action === "list") {
      if (!validPlayerToken(body.token)) return json({ error: "Sessão inválida. Entre novamente com o código da mesa." }, 401);
      const { data, error } = await admin.from("master_library").select("id,title,file_name,size_bytes,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ items: data ?? [] });
    }
    if (action === "open") {
      if (!validPlayerToken(body.token)) return json({ error: "Sessão inválida." }, 401);
      const { data, error } = await admin.from("master_library").select("storage_path").eq("id", String(body.id ?? "")).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Arquivo não encontrado." }, 404);
      const signed = await admin.storage.from(BUCKET).createSignedUrl(data.storage_path, 10 * 60);
      if (signed.error) throw signed.error;
      return json({ url: signed.data.signedUrl });
    }
    if (action === "delete") {
      if (!await validMaster(body.master)) return json({ error: "Apenas o mestre pode apagar arquivos." }, 403);
      const { data, error } = await admin.from("master_library").select("storage_path").eq("id", String(body.id ?? "")).maybeSingle();
      if (error) throw error;
      if (data) await admin.storage.from(BUCKET).remove([data.storage_path]);
      await admin.from("master_library").delete().eq("id", String(body.id ?? ""));
      return json({ ok: true });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("library error", error);
    return json({ error: "Não foi possível atualizar a Biblioteca." }, 500);
  }
});
