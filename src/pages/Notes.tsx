import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, StickyNote } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

const Notes = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('arcanum-notes', []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = () => {
    if (!title.trim()) return;
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, title, content } : n));
      setEditingId(null);
    } else {
      setNotes(prev => [{ id: crypto.randomUUID(), title, content, createdAt: Date.now() }, ...prev]);
    }
    setTitle('');
    setContent('');
  };

  const edit = (n: Note) => { setTitle(n.title); setContent(n.content); setEditingId(n.id); };
  const remove = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); if (editingId === id) { setEditingId(null); setTitle(''); setContent(''); } };
  const cancel = () => { setEditingId(null); setTitle(''); setContent(''); };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Notas</h1>

      <Card className="card-hover">
        <CardContent className="p-4 space-y-3">
          <Input placeholder="Título da nota" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Conteúdo..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />{editingId ? 'Atualizar' : 'Adicionar'} Nota
            </Button>
            {editingId && <Button variant="outline" onClick={cancel}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      {notes.length === 0 && (
        <Card className="card-hover"><CardContent className="p-8 text-center text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-30" />
          Nenhuma nota ainda
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {notes.map(n => (
          <Card key={n.id} className={`card-hover cursor-pointer ${editingId === n.id ? 'border-primary/50' : ''}`} onClick={() => edit(n)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">{n.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={e => { e.stopPropagation(); remove(n.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notes;
