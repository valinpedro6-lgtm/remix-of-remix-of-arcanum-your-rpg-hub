import { useEffect, useMemo, useState } from 'react';
import { BookOpen, FilePlus2, FileText, LibraryBig, Loader2, Maximize2, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { isMaster, MASTER_KEY } from '@/lib/access';
import { toast } from 'sonner';

type LibraryBook = { id: string; title: string; subtitle: string; file: string; createdAt?: string; remote?: boolean };

const defaultBook: LibraryBook = { id: 'ordem-paranormal', title: 'LIVRO ORDEM PARANORMAL', subtitle: 'Livro de referência da campanha', file: '/livro-ordem-paranormal.pdf' };

const Library = () => {
  const [books, setBooks] = useState<LibraryBook[]>([defaultBook]);
  const [selectedId, setSelectedId] = useState(defaultBook.id);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const master = isMaster();
  const selected = books.find(book => book.id === selectedId) ?? books[0];

  const loadBooks = async () => {
    try {
      const { data } = await supabase.functions.invoke('library', { body: { action: 'list' } });
      const remoteBooks: LibraryBook[] = (data?.documents ?? []).map((book: { id: string; title: string; file_url: string; created_at: string }) => ({ id: book.id, title: book.title, subtitle: 'PDF da campanha', file: book.file_url, createdAt: book.created_at, remote: true }));
      setBooks([defaultBook, ...remoteBooks.filter(book => book.file !== defaultBook.file)]);
    } catch {
      // O livro base continua disponível mesmo se o backend estiver temporariamente indisponível.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooks(); }, []);

  const visibleBooks = useMemo(() => books.filter(book => `${book.title} ${book.subtitle}`.toLowerCase().includes(search.toLowerCase())), [books, search]);

  const uploadPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Escolha um arquivo PDF.');
    if (file.size > 80 * 1024 * 1024) return toast.error('O PDF deve ter no máximo 80 MB.');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('master', localStorage.getItem(MASTER_KEY) ?? '');
      form.append('title', file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '));
      form.append('file', file);
      const { data, error } = await supabase.functions.invoke('library', { body: form });
      if (error || !data?.ok) throw new Error(data?.error ?? 'Falha no envio');
      toast.success('PDF adicionado para todos os jogadores.');
      await loadBooks();
      if (data.document?.id) setSelectedId(data.document.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o PDF.');
    } finally { setUploading(false); }
  };

  const removeBook = async (book: LibraryBook) => {
    if (!book.remote || !confirm(`Remover “${book.title}” da biblioteca de todos?`)) return;
    const { data, error } = await supabase.functions.invoke('library', { body: { action: 'delete', id: book.id, master: localStorage.getItem(MASTER_KEY) ?? '' } });
    if (error || !data?.ok) return toast.error(data?.error ?? 'Não foi possível remover o livro.');
    setBooks(current => current.filter(item => item.id !== book.id));
    setSelectedId(defaultBook.id);
    toast.success('Livro removido da biblioteca.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/70 p-5 shadow-[0_20px_60px_-30px_hsl(var(--primary)/.55)] sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-primary"><LibraryBig className="h-5 w-5" /><span className="font-body text-xs font-bold uppercase tracking-[.28em]">Arquivo da campanha</span></div><h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">Biblioteca</h1><p className="mt-1 max-w-xl text-sm text-muted-foreground">Livros e PDFs da mesa. O mestre adiciona uma vez e todos os jogadores acessam pelo próprio código.</p></div>
          <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar livro" className="bg-background/60 pl-9" /></div>
        </div>
      </header>

      {master && <section className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-sm font-bold uppercase tracking-wider text-primary">Área do mestre</p><p className="text-xs text-muted-foreground">Envie PDFs para a biblioteca compartilhada da campanha.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />} {uploading ? 'Enviando PDF…' : 'Adicionar PDF'}<input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploading} onChange={uploadPdf} /></label></section>}

      <section>
        <div className="mb-3 flex items-center justify-between"><p className="font-body text-xs font-bold uppercase tracking-[.24em] text-muted-foreground">Livros disponíveis · {visibleBooks.length}</p>{loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div>
        {visibleBooks.length ? <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6 xl:grid-cols-9">
          {visibleBooks.map(book => <button key={book.id} type="button" onClick={() => setSelectedId(book.id)} className={`group relative overflow-hidden rounded-lg border text-left transition-all ${selected.id === book.id ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/.25),0_12px_30px_-18px_hsl(var(--primary))]' : 'border-border/70 hover:-translate-y-1 hover:border-primary/50'}`}>
            <div className="relative aspect-[.7] overflow-hidden bg-gradient-to-br from-red-950 via-[#271519] to-black p-2 sm:p-3"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(120deg, transparent 0 9px, rgba(255,255,255,.08) 10px 11px)' }} /><div className="relative flex h-full flex-col items-center justify-between border border-white/20 p-1.5 text-center sm:p-2"><BookOpen className="mt-1 h-5 w-5 text-primary sm:h-7 sm:w-7" /><p className="line-clamp-4 font-display text-[9px] font-bold leading-tight text-white sm:text-xs">{book.title}</p><p className="font-body text-[8px] uppercase tracking-widest text-white/50 sm:text-[9px]">PDF</p></div></div><div className="border-t border-border/60 bg-card/80 px-2 py-1.5"><p className="truncate text-[10px] font-semibold text-foreground sm:text-xs">{book.title}</p><p className="truncate text-[9px] text-muted-foreground">{book.subtitle}</p></div>{master && book.remote && <span role="button" tabIndex={0} onClick={event => { event.stopPropagation(); removeBook(book); }} className="absolute right-1 top-1 rounded bg-black/70 p-1 text-red-300 opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3 w-3" /></span>}
          </button>)}
        </div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-[0_20px_60px_-35px_black]"><div className="flex flex-col gap-3 border-b border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0"><h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">{selected.title}</h2><p className="text-xs text-muted-foreground">Leitor interno · permanece dentro do Arcanum</p></div></div><a href={selected.file} download className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"><Maximize2 className="h-3.5 w-3.5" /> Baixar uma cópia</a></div><div className="h-[calc(100dvh-300px)] min-h-[560px] bg-[#202023] p-2 sm:p-4"><iframe title={selected.title} src={`${selected.file}#view=FitH`} className="h-full w-full rounded-md border border-white/10 bg-white shadow-2xl" /></div></section>
    </div>
  );
};

export default Library;
