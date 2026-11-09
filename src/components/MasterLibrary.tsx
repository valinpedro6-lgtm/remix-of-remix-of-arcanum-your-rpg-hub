import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, FileUp, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { deleteLibraryItem, LibraryItem, listLibrary, uploadLibraryPdf } from '@/lib/library';

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const MasterLibrary = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await listLibrary()); } catch { /* a biblioteca pode ainda não ter sido criada no banco */ }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const upload = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast({ title: 'Envie somente PDF', variant: 'destructive' }); return; }
    if (file.size > 50 * 1024 * 1024) { toast({ title: 'PDF muito grande', description: 'O limite é 50 MB.', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const item = await uploadLibraryPdf(file, title.trim() || file.name.replace(/\.pdf$/i, ''));
      setItems(current => [item, ...current]); setTitle('');
      toast({ title: 'PDF publicado na Biblioteca' });
    } catch (error) { toast({ title: 'Não consegui publicar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const remove = async (item: LibraryItem) => {
    if (!confirm(`Remover “${item.title}” da Biblioteca?`)) return;
    try { await deleteLibraryItem(item.id); setItems(current => current.filter(entry => entry.id !== item.id)); toast({ title: 'PDF removido' }); }
    catch (error) { toast({ title: 'Não consegui remover', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); }
  };

  return <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Biblioteca da mesa</CardTitle><p className="text-sm text-muted-foreground">Publique livros e suplementos em PDF. Os jogadores abrem tudo dentro do Arcanum, sem uma nova aba.</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 md:grid-cols-[1fr_auto]"><Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Título do material (opcional)" /><Button onClick={() => inputRef.current?.click()} disabled={busy} className="gap-2"><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={event => void upload(event.target.files?.[0])} />{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Publicar PDF</Button></div><p className="text-[11px] text-muted-foreground">PDF até 50 MB. A Biblioteca é compartilhada automaticamente com quem entrar usando o código desta mesa.</p><div className="divide-y divide-border/30 rounded-lg border border-border/40">{!items.length ? <p className="p-5 text-center text-sm text-muted-foreground">Nenhum material publicado ainda.</p> : items.map(item => <div key={item.id} className="flex items-center gap-3 p-3"><FileUp className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.file_name} · {formatSize(item.size_bytes)}</p></div><Button variant="ghost" size="icon" onClick={() => void remove(item)} aria-label={`Remover ${item.title}`}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button></div>)}</div></CardContent></Card>;
};
