import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BUCKET = "arcanum-library";
const safeName = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "livro";

async function isMaster(master: string) {
  const { data } = await admin.from("access_gate").select("master_password").eq("id", 1).maybeSingle();
  return !!data && master === data.master_password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const master = String(form.get("master") ?? "");
      if (!(await isMaster(master))) return json({ ok: false, error: "Apenas o mestre pode adicionar livros." }, 403);
      const file = form.get("file");
      if (!(file instanceof File) || file.type !== "application/pdf") return json({ ok: false, error: "Envie um arquivo PDF." }, 400);
      if (file.size > 80 * 1024 * 1024) return json({ ok: false, error: "O PDF deve ter no máximo 80 MB." }, 400);
      const title = String(form.get("title") ?? file.name.replace(/\.pdf$/i, "")).trim().slice(0, 120) || "Livro da campanha";
      const path = `${Date.now()}-${safeName(title)}.pdf`;
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path);
      const { data, error } = await admin.from("library_documents").insert({ title, file_url: publicUrl.publicUrl, storage_path: path }).select("id,title,file_url,created_at").single();
      if (error) throw error;
      return json({ ok: true, document: data });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action === "list") {
      const { data, error } = await admin.from("library_documents").select("id,title,file_url,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ documents: data ?? [] });
    }
    if (body.action === "delete") {
      if (!(await isMaster(String(body.master ?? "")))) return json({ ok: false, error: "Apenas o mestre pode remover livros." }, 403);
      const { data: document } = await admin.from("library_documents").select("storage_path").eq("id", String(body.id ?? "")).maybeSingle();
      if (document?.storage_path) await admin.storage.from(BUCKET).remove([document.storage_path]);
      await admin.from("library_documents").delete().eq("id", String(body.id ?? ""));
      return json({ ok: true });
    }
    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("library error", error);
    return json({ ok: false, error: "Não foi possível atualizar a biblioteca." }, 500);
  }
});
