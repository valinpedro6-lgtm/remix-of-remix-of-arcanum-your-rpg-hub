import { useState } from 'react';
import { BookOpen, ChevronRight, FileText, LibraryBig, Maximize2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const books = [
  {
    id: 'ordem-paranormal',
    title: 'LIVRO ORDEM PARANORMAL',
    subtitle: 'Livro de referência da campanha',
    description: 'Consulte o material diretamente dentro do Arcanum, sem sair da plataforma.',
    file: '/livro-ordem-paranormal.pdf',
    accent: 'from-red-950 via-[#211114] to-black',
  },
];

const Library = () => {
  const [selectedId, setSelectedId] = useState(books[0].id);
  const [search, setSearch] = useState('');
  const selected = books.find(book => book.id === selectedId) ?? books[0];
  const visibleBooks = books.filter(book => `${book.title} ${book.subtitle}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/70 p-6 shadow-[0_20px_60px_-30px_hsl(var(--primary)/.55)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-primary"><LibraryBig className="h-5 w-5" /><span className="font-body text-xs font-bold uppercase tracking-[.28em]">Arquivo da campanha</span></div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">Biblioteca</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Livros, PDFs e materiais da mesa reunidos em um leitor dentro do Arcanum.</p>
          </div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar na biblioteca" className="pl-9 bg-background/60" /></div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <p className="px-1 font-body text-xs font-bold uppercase tracking-[.24em] text-muted-foreground">Seus livros · {visibleBooks.length}</p>
          {visibleBooks.map(book => (
            <button key={book.id} type="button" onClick={() => setSelectedId(book.id)} className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all ${selected.id === book.id ? 'border-primary/70 bg-primary/10 shadow-[0_12px_30px_-18px_hsl(var(--primary))]' : 'border-border/60 bg-card/45 hover:border-primary/35 hover:bg-card/80'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${book.accent} opacity-70`} />
              <div className="relative flex items-start gap-3">
                <div className="grid h-12 w-10 shrink-0 place-items-center rounded border border-white/20 bg-black/50 text-primary shadow-inner"><BookOpen className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-display text-sm font-bold leading-tight text-white">{book.title}</p><p className="mt-1 text-xs text-white/60">{book.subtitle}</p></div>
                <ChevronRight className={`mt-1 h-4 w-4 shrink-0 text-primary transition-transform ${selected.id === book.id ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
              </div>
            </button>
          ))}
          {visibleBooks.length === 0 && <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</div>}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-[0_20px_60px_-35px_black]">
          <div className="flex flex-col gap-3 border-b border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-foreground">{selected.title}</h2><p className="text-xs text-muted-foreground">Leitor interno · o PDF permanece dentro do Arcanum</p></div></div>
            <a href={selected.file} download className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"><Maximize2 className="h-3.5 w-3.5" /> Baixar uma cópia</a>
          </div>
          <div className="h-[calc(100dvh-280px)] min-h-[560px] bg-[#202023] p-2 sm:p-4">
            <iframe title={selected.title} src={`${selected.file}#view=FitH`} className="h-full w-full rounded-md border border-white/10 bg-white shadow-2xl" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Library;
