import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, StickyNote, Search, Pin, PinOff, Copy, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  pinned?: boolean;
  color?: string;
}

const COLORS = [
  { label: 'Padrão', value: '' },
  { label: '🔴 Urgente', value: 'border-l-4 border-l-destructive' },
  { label: '🟡 Importante', value: 'border-l-4 border-l-amber-500' },
  { label: '🟢 Lore', value: 'border-l-4 border-l-green-500' },
  { label: '🔵 Info', value: 'border-l-4 border-l-blue-500' },
  { label: '🟣 Segredo', value: 'border-l-4 border-l-purple-500' },
];

const Notes = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('arcanum-notes', []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | string>('all');

  const save = () => {
    if (!title.trim()) return;
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, title, content, color: selectedColor } : n));
      setEditingId(null);
    } else {
      setNotes(prev => [{ id: crypto.randomUUID(), title, content, createdAt: Date.now(), pinned: false, color: selectedColor }, ...prev]);
    }
    setTitle('');
    setContent('');
    setSelectedColor('');
  };

  const edit = (n: Note) => { setTitle(n.title); setContent(n.content); setEditingId(n.id); setSelectedColor(n.color || ''); };
  const remove = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); if (editingId === id) cancel(); };
  const cancel = () => { setEditingId(null); setTitle(''); setContent(''); setSelectedColor(''); };
  const togglePin = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const duplicate = (n: Note) => setNotes(prev => [{ ...n, id: crypto.randomUUID(), title: `${n.title} (cópia)`, createdAt: Date.now(), pinned: false }, ...prev]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = notes.filter(n => {
      const matchesQuery = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || (filter === 'pinned' ? n.pinned : n.color === filter);
      return matchesQuery && matchesFilter;
    });
    // Pinned first, then by date
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [notes, search, filter]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Memória da campanha</p><h1 className="page-title mt-1">Bloco de notas</h1><p className="mt-2 text-sm text-muted-foreground">Capture pistas, decisões e ideias sem perder o fio da sessão.</p></div>
        <div className="flex gap-2 text-center"><div className="note-stat"><strong>{notes.length}</strong><span>notas</span></div><div className="note-stat"><strong>{notes.filter(n => n.pinned).length}</strong><span>fixadas</span></div></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="card-hover glow-border">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Título da nota" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Conteúdo..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <Badge
                  key={c.label}
                  variant={selectedColor === c.value ? 'default' : 'outline'}
                  className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                  onClick={() => setSelectedColor(c.value)}
                >
                  {c.label}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={save} className="flex-1 gap-1">
                <Plus className="w-4 h-4" />{editingId ? 'Atualizar' : 'Adicionar'} Nota
              </Button>
              {editingId && <Button variant="outline" onClick={cancel}>Cancelar</Button>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar por título ou conteúdo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"><ListFilter className="h-4 w-4 shrink-0 text-primary" />{[{ label: 'Todas', value: 'all' }, { label: 'Fixadas', value: 'pinned' }, ...COLORS.filter(c => c.value).map(c => ({ label: c.label, value: c.value }))].map(item => <Button key={item.value} type="button" size="sm" variant={filter === item.value ? 'default' : 'outline'} className="h-8 shrink-0 rounded-full text-xs" onClick={() => setFilter(item.value)}>{item.label}</Button>)}</div>
        </div>
      )}

      {filtered.length === 0 && notes.length === 0 && (
        <Card className="card-hover"><CardContent className="p-8 text-center text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-20" />
          Nenhuma nota ainda
        </CardContent></Card>
      )}

      {filtered.length === 0 && notes.length > 0 && (
        <p className="text-center text-muted-foreground py-4">Nenhuma nota encontrada para "{search}"</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {filtered.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className={`card-hover cursor-pointer group relative ${editingId === n.id ? 'border-primary/50' : ''} ${n.color || ''}`} onClick={() => edit(n)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {n.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <h3 className="font-display font-semibold truncate">{n.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); togglePin(n.id); }}>
                        {n.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); duplicate(n); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); remove(n.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notes;
