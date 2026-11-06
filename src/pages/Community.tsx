import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LockKeyhole, LogOut, MessageCircle, RefreshCw, Send, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CommunityPost, PrivateMessage, deleteCommunityPost, listCommunityContacts, listCommunityPosts, listPrivateMessages, sendPrivateMessage, createCommunityPost } from '@/lib/community';
import { EMAIL_KEY, logout } from '@/lib/access';

type View = 'public' | 'private';

const Community = () => {
  const [view, setView] = useState<View>('public');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const email = localStorage.getItem(EMAIL_KEY) ?? '';
  const missingIdentity = !email;

  const loadPublic = useCallback(async () => {
    if (!localStorage.getItem(EMAIL_KEY)) { setLoading(false); return; }
    setLoading(true);
    try { setPosts(await listCommunityPosts()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui carregar as conversas.'); }
    finally { setLoading(false); }
  }, []);
  const loadContacts = useCallback(async () => {
    if (!localStorage.getItem(EMAIL_KEY)) return;
    try { setContacts(await listCommunityContacts()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui carregar os usuários.'); }
  }, []);
  const loadPrivate = useCallback(async () => {
    if (!selectedContact) return;
    try { setMessages(await listPrivateMessages(selectedContact)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui carregar essa conversa.'); }
  }, [selectedContact]);

  useEffect(() => { void loadPublic(); void loadContacts(); }, [loadPublic, loadContacts]);
  useEffect(() => { if (view === 'private') void loadPrivate(); }, [view, loadPrivate]);
  useEffect(() => {
    const id = window.setInterval(() => { if (view === 'public') void loadPublic(); else void loadPrivate(); }, 12000);
    return () => window.clearInterval(id);
  }, [view, loadPublic, loadPrivate]);

  const roots = useMemo(() => posts.filter(post => !post.parent_id), [posts]);
  const postReplies = (id: string) => posts.filter(post => post.parent_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const submitPublic = async () => {
    if (missingIdentity) { toast.error('Sua sessão ainda não tem e-mail. Saia e entre novamente usando seu e-mail.'); return; }
    if (!draft.trim()) return;
    setSending(true);
    try { const created = await createCommunityPost(draft.trim(), 'geral'); setPosts(current => [created, ...current]); setDraft(''); toast.success('Mensagem publicada.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui publicar.'); }
    finally { setSending(false); }
  };
  const submitPrivate = async () => {
    if (missingIdentity) { toast.error('Sua sessão ainda não tem e-mail. Saia e entre novamente usando seu e-mail.'); return; }
    if (!draft.trim() || !selectedContact) return;
    setSending(true);
    try { const created = await sendPrivateMessage(selectedContact, draft.trim()); setMessages(current => [...current, created]); setDraft(''); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui enviar a mensagem.'); }
    finally { setSending(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Apagar esta mensagem e suas respostas?')) return;
    await deleteCommunityPost(id).then(() => setPosts(current => current.filter(post => post.id !== id && post.parent_id !== id))).catch(() => toast.error('Não consegui apagar.'));
  };
  const openPrivate = (contact: string) => { setSelectedContact(contact); setView('private'); setDraft(''); };

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card/75 to-card/30"><CardContent className="p-5 md:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge className="mb-3 gap-2 bg-primary/15 text-primary hover:bg-primary/20"><Users className="h-3.5 w-3.5" /> Arcanum Comunidade</Badge><h1 className="font-display text-3xl font-black tracking-wide md:text-5xl">Conversa boa não termina na mesa.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">Um lugar simples para trocar ideia com a comunidade. Fale com todo mundo ou chame alguém no privado pelo nome de usuário.</p></div><div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${missingIdentity ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-border/50 bg-background/20 text-muted-foreground'}`}><ShieldCheck className="h-4 w-4" /><span>{email || 'E-mail não vinculado'}</span></div></div>{missingIdentity && <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-amber-200">Vincule seu e-mail para conversar</p><p className="mt-1 text-xs leading-relaxed text-amber-100/70">Esta sessão entrou sem identidade de usuário. Saia e entre novamente; depois do código, informe seu e-mail para publicar e usar os privados.</p></div><Button variant="outline" onClick={() => logout()} className="shrink-0 gap-2 border-amber-500/40 text-amber-200 hover:bg-amber-500/15"><LogOut className="h-4 w-4" /> Corrigir identidade</Button></div>}</CardContent></Card>

    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="space-y-2 lg:sticky lg:top-5 lg:h-fit"><p className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Conversas</p><button onClick={() => { setView('public'); setDraft(''); }} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${view === 'public' ? 'border-primary/50 bg-primary/12 text-primary' : 'border-border/40 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}><MessageCircle className="h-4 w-4" /><div><p className="text-sm font-semibold">Praça pública</p><p className="text-[11px] opacity-75">Todo mundo conversa</p></div></button><button onClick={() => { setView('private'); void loadContacts(); }} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${view === 'private' ? 'border-primary/50 bg-primary/12 text-primary' : 'border-border/40 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}><LockKeyhole className="h-4 w-4" /><div><p className="text-sm font-semibold">Privados</p><p className="text-[11px] opacity-75">Chame alguém direto</p></div></button><div className="mt-5 rounded-xl border border-border/40 bg-card/30 p-3 text-xs leading-relaxed text-muted-foreground"><UserPlus className="mb-2 h-4 w-4 text-primary" /><p>Para chamar alguém, clique no e-mail dela em uma conversa pública ou escolha um usuário na lista de privados.</p></div></aside>

      <div className="min-w-0 space-y-4">
        {view === 'public' ? <>
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Praça pública</CardTitle><Button variant="ghost" size="icon" onClick={() => void loadPublic()} disabled={loading || missingIdentity} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></CardHeader><CardContent><div className="space-y-3"><Textarea value={draft} onChange={event => setDraft(event.target.value)} disabled={missingIdentity} maxLength={4000} placeholder={missingIdentity ? 'Vincule seu e-mail para publicar...' : 'Puxe uma conversa com a comunidade...'} className="min-h-24 resize-y" /><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Você aparece como <strong className="text-foreground">{email || 'e-mail não vinculado'}</strong> · {draft.length}/4000</p><Button onClick={() => void submitPublic()} disabled={sending || missingIdentity || !draft.trim()} className="gap-2"><Send className="h-4 w-4" /> Publicar</Button></div></div></CardContent></Card>
          {loading && !posts.length ? <div className="py-12 text-center text-sm text-muted-foreground">Carregando a conversa...</div> : !roots.length ? <Card className="border-dashed border-border/60 bg-card/30"><CardContent className="py-16 text-center"><MessageCircle className="mx-auto h-10 w-10 text-primary/50" /><h2 className="mt-4 font-display text-2xl font-bold">A praça está silenciosa.</h2><p className="mt-2 text-sm text-muted-foreground">Puxe o primeiro assunto.</p></CardContent></Card> : roots.map(item => <Card key={item.id} className="glass-card overflow-hidden"><CardContent className="space-y-4 p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">{item.username.charAt(0).toUpperCase()}</div><div className="min-w-0"><button onClick={() => openPrivate(item.username)} className="truncate text-left text-sm font-bold hover:text-primary hover:underline">{item.username}</button><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-BR')}</p></div></div>{item.username === email && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => void remove(item.id)} aria-label="Apagar mensagem"><X className="h-4 w-4" /></Button>}</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>{postReplies(item.id).map(child => <div key={child.id} className="ml-3 border-l-2 border-primary/25 pl-4"><div className="flex items-center justify-between gap-2"><button onClick={() => openPrivate(child.username)} className="text-xs font-bold hover:text-primary hover:underline">{child.username}</button>{child.username === email && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => void remove(child.id)} aria-label="Apagar resposta"><X className="h-3.5 w-3.5" /></Button>}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{child.body}</p></div>)}</CardContent></Card>)}
        </> : <>
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-primary" /> Conversa privada</CardTitle><Button variant="ghost" size="icon" onClick={() => { void loadContacts(); void loadPrivate(); }} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></Button></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]"><div className="space-y-2"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Usuários disponíveis</p>{!contacts.length ? <p className="rounded-lg border border-dashed border-border/50 p-3 text-xs text-muted-foreground">Ainda não encontrei outros usuários conectados.</p> : contacts.map(contact => <button key={contact} onClick={() => { setSelectedContact(contact); setDraft(''); }} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-all ${selectedContact === contact ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-background/20 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>{contact}</button>)}</div><div className="min-h-[24rem] rounded-xl border border-border/40 bg-background/20 p-4">{!selectedContact ? <div className="grid h-full min-h-[20rem] place-items-center text-center text-sm text-muted-foreground"><div><LockKeyhole className="mx-auto mb-3 h-8 w-8 text-primary/50" /><p>Escolha alguém para abrir um privado.</p><p className="mt-1 text-xs">Você também pode clicar no nome de alguém na praça pública.</p></div></div> : <div className="flex h-full min-h-[20rem] flex-col"><div className="mb-3 flex items-center gap-2 border-b border-border/40 pb-3"><Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSelectedContact('')}><ArrowLeft className="h-4 w-4" /></Button><div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{selectedContact.charAt(0).toUpperCase()}</div><div><p className="text-sm font-bold">{selectedContact}</p><p className="text-[11px] text-muted-foreground">Conversa só entre vocês</p></div></div><div className="flex-1 space-y-2 overflow-y-auto pr-1">{!messages.length ? <p className="py-12 text-center text-xs text-muted-foreground">Comece a conversa.</p> : messages.map(message => <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${message.sender_email === email ? 'ml-auto bg-primary/15 text-foreground' : 'bg-card text-muted-foreground'}`}><p className="whitespace-pre-wrap leading-relaxed">{message.body}</p><p className="mt-1 text-[10px] opacity-60">{new Date(message.created_at).toLocaleString('pt-BR')}</p></div>)}</div><div className="mt-3 flex gap-2 border-t border-border/40 pt-3"><Textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} placeholder="Escreva no privado..." className="min-h-16" /><Button onClick={() => void submitPrivate()} disabled={sending || !draft.trim()} size="icon" className="mt-auto" aria-label="Enviar mensagem privada"><Send className="h-4 w-4" /></Button></div></div>}</div></div></CardContent></Card>
        </>}
      </div>
    </div>
  </div>;
};

export default Community;
