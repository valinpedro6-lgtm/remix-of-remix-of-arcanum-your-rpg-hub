import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, RefreshCw, Send, ShieldCheck, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CommunityPost, CommunityTopic, createCommunityPost, deleteCommunityPost, listCommunityPosts } from '@/lib/community';
import { EMAIL_KEY } from '@/lib/access';

const topics: { id: 'all' | CommunityTopic; label: string; description: string }[] = [
  { id: 'all', label: 'Tudo', description: 'Todas as conversas' },
  { id: 'geral', label: 'Geral', description: 'Papo da comunidade' },
  { id: 'mesas', label: 'Mesas', description: 'Encontre e organize grupos' },
  { id: 'ordem', label: 'Ordem Paranormal', description: 'Edição atual e Playtest' },
  { id: 'homebrew', label: 'Homebrew', description: 'Criações da comunidade' },
  { id: 'duvidas', label: 'Dúvidas', description: 'Ajuda entre mestres' },
];

const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [topic, setTopic] = useState<'all' | CommunityTopic>('all');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const email = localStorage.getItem(EMAIL_KEY) ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await listCommunityPosts(topic)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui carregar a Comunidade.'); }
    finally { setLoading(false); }
  }, [topic]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const id = window.setInterval(() => void load(), 15000); return () => window.clearInterval(id); }, [load]);

  const roots = useMemo(() => posts.filter(post => !post.parent_id), [posts]);
  const childrenOf = (id: string) => posts.filter(post => post.parent_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const post = async (body: string, selectedTopic: CommunityTopic, parentId?: string) => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const created = await createCommunityPost(body.trim(), selectedTopic, parentId);
      setPosts(current => [created, ...current]);
      if (parentId) { setReply(''); setReplyTo(null); } else setDraft('');
      toast.success(parentId ? 'Resposta enviada.' : 'Mensagem publicada.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui publicar.'); }
    finally { setSending(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Apagar esta mensagem e suas respostas?')) return;
    await deleteCommunityPost(id).then(() => setPosts(current => current.filter(post => post.id !== id && post.parent_id !== id))).catch(() => toast.error('Não consegui apagar.'));
  };

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card/75 to-card/30"><CardContent className="p-5 md:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge className="mb-3 gap-2 bg-primary/15 text-primary hover:bg-primary/20"><Users className="h-3.5 w-3.5" /> Arcanum Comunidade</Badge><h1 className="font-display text-3xl font-black tracking-wide md:text-5xl">A mesa continua depois da sessão.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">Um fórum para encontrar gente, compartilhar casos, discutir regras e transformar ideias em campanhas. Seu nome aparece como o e-mail usado no acesso.</p></div><div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/20 px-3 py-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /><span>{email || 'Identidade conectada'}</span></div></div></CardContent></Card>

    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="space-y-2 lg:sticky lg:top-5 lg:h-fit"><p className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Canais</p>{topics.map(item => <button key={item.id} onClick={() => setTopic(item.id)} className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${topic === item.id ? 'border-primary/50 bg-primary/12 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.1)]' : 'border-border/40 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}><p className="text-sm font-semibold">{item.label}</p><p className="mt-0.5 text-[11px] opacity-75">{item.description}</p></button>)}</aside>
      <div className="min-w-0 space-y-4">
        <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Compartilhe com a mesa</CardTitle><Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></CardHeader><CardContent><div className="space-y-3"><Textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} placeholder="O que está acontecendo na sua mesa? Uma dúvida, uma teoria ou uma ideia que merece sair do caderno..." className="min-h-24 resize-y" /><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Você publica como <strong className="text-foreground">{email || 'seu e-mail conectado'}</strong> · {draft.length}/4000</p><Button onClick={() => void post(draft, topic === 'all' ? 'geral' : topic)} disabled={sending || !draft.trim()} className="gap-2"><Send className="h-4 w-4" /> Publicar</Button></div></div></CardContent></Card>

        {loading && !posts.length ? <div className="py-12 text-center text-sm text-muted-foreground">Carregando as conversas...</div> : !roots.length ? <Card className="border-dashed border-border/60 bg-card/30"><CardContent className="py-16 text-center"><MessageCircle className="mx-auto h-10 w-10 text-primary/50" /><h2 className="mt-4 font-display text-2xl font-bold">Este canal está silencioso.</h2><p className="mt-2 text-sm text-muted-foreground">Seja a primeira pessoa a abrir uma conversa.</p></CardContent></Card> : roots.map(item => <Card key={item.id} className="glass-card overflow-hidden"><CardContent className="space-y-4 p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">{item.username.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{item.username}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-BR')} · {topics.find(channel => channel.id === item.topic)?.label ?? item.topic}</p></div></div>{item.username === email && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => void remove(item.id)} aria-label="Apagar mensagem"><X className="h-4 w-4" /></Button>}</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setReplyTo(replyTo === item.id ? null : item.id)} className="gap-2"><MessageCircle className="h-3.5 w-3.5" /> Responder ({childrenOf(item.id).length})</Button></div>{childrenOf(item.id).map(child => <div key={child.id} className="ml-3 border-l-2 border-primary/25 pl-4"><div className="flex items-center justify-between gap-2"><div><span className="text-xs font-bold">{child.username}</span><span className="ml-2 text-[11px] text-muted-foreground">{new Date(child.created_at).toLocaleString('pt-BR')}</span></div>{child.username === email && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => void remove(child.id)} aria-label="Apagar resposta"><X className="h-3.5 w-3.5" /></Button>}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{child.body}</p></div>)}{replyTo === item.id && <div className="flex gap-2 border-t border-border/40 pt-3"><Textarea value={reply} onChange={event => setReply(event.target.value)} maxLength={4000} placeholder="Escreva uma resposta..." className="min-h-16" /><Button onClick={() => void post(reply, item.topic as CommunityTopic, item.id)} disabled={sending || !reply.trim()} size="icon" className="mt-auto" aria-label="Enviar resposta"><Send className="h-4 w-4" /></Button></div>}</CardContent></Card>)}
      </div>
    </div>
  </div>;
};

export default Community;
