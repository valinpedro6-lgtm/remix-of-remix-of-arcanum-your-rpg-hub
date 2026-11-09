import { useCallback, useEffect, useState } from 'react';
import { BookOpen, FileText, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LibraryItem, listLibrary, openLibraryItem } from '@/lib/library';

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const Library = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [active, setActive] = useState<LibraryItem | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listLibrary()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui carregar a Biblioteca.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = async (item: LibraryItem) => {
    setOpening(true);
    try { setActive(item); setUrl(await openLibraryItem(item.id)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui abrir este PDF.'); }
    finally { setOpening(false); }
  };
  const close = () => { setActive(null); setUrl(''); };

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><Badge className="mb-2 gap-2 bg-primary/15 text-primary hover:bg-primary/20"><BookOpen className="h-3.5 w-3.5" /> Biblioteca da mesa</Badge><h1 className="page-title">Livros e materiais</h1><p className="text-sm text-muted-foreground">Arquivos publicados pelo mestre para esta mesa.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</Button></div>
    {active && url ? <Card className="overflow-hidden border-primary/30"><CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border/40"><FileText className="h-5 w-5 shrink-0 text-primary" /><CardTitle className="min-w-0 flex-1 truncate">{active.title}</CardTitle><Button variant="ghost" size="icon" onClick={close} aria-label="Fechar leitor"><X className="h-5 w-5" /></Button></CardHeader><CardContent className="p-0"><iframe title={`Leitor: ${active.title}`} src={url} className="h-[calc(100vh-13rem)] min-h-[30rem] w-full bg-muted" /></CardContent></Card> : <>
      {loading && !items.length ? <div className="py-16 text-center text-sm text-muted-foreground">Carregando a Biblioteca...</div> : !items.length ? <Card className="border-dashed border-border/60 bg-card/30"><CardContent className="py-20 text-center"><BookOpen className="mx-auto h-12 w-12 text-primary/45" /><h2 className="mt-4 font-display text-2xl font-bold">A Biblioteca está vazia.</h2><p className="mt-2 text-sm text-muted-foreground">Quando o mestre publicar um PDF, ele aparecerá aqui.</p></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <Card key={item.id} className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_28px_hsl(var(--primary)/0.12)]" onClick={() => void open(item)}><CardContent className="flex items-start gap-4 p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><FileText className="h-6 w-6" /></div><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold group-hover:text-primary">{item.title}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{item.file_name}</p><p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">PDF · {formatSize(item.size_bytes)}</p></div></CardContent></Card>)}</div>}
    </>}
    {opening && <p className="text-center text-xs text-muted-foreground">Abrindo o leitor...</p>}
  </div>;
};

export default Library;
