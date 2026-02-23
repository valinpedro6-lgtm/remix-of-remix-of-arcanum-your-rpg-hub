import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Shield, Heart, User } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  image: string;
  className: string;
  level: number;
  hp: number;
  maxHp: number;
  ca: number;
  notes: string;
}

const emptyPlayer = (): Player => ({
  id: crypto.randomUUID(), name: '', image: '', className: '', level: 1, hp: 10, maxHp: 10, ca: 10, notes: '',
});

const Players = () => {
  const [players, setPlayers] = useLocalStorage<Player[]>('arcanum-players', []);
  const [editing, setEditing] = useState<Player | null>(null);
  const [open, setOpen] = useState(false);

  const save = () => {
    if (!editing?.name.trim()) return;
    setPlayers(prev => {
      const exists = prev.find(p => p.id === editing.id);
      return exists ? prev.map(p => p.id === editing.id ? editing : p) : [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  const openNew = () => { setEditing(emptyPlayer()); setOpen(true); };
  const openEdit = (p: Player) => { setEditing({ ...p }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Jogadores</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
      </div>

      {players.length === 0 && (
        <Card className="card-hover"><CardContent className="p-8 text-center text-muted-foreground">Nenhum jogador cadastrado</CardContent></Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(p => (
          <Card key={p.id} className="card-hover overflow-hidden">
            <CardContent className="p-0">
              {p.image && (
                <div className="h-40 bg-secondary overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              {!p.image && (
                <div className="h-40 bg-secondary flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-xl font-display font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.className} • Nível {p.level}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-accent" />
                    <span className="font-semibold">{p.hp}/{p.maxHp}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{p.ca}</span>
                  </div>
                </div>
                {p.notes && <p className="text-sm text-muted-foreground">{p.notes}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="flex-1"><Edit className="w-3 h-3 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing?.id && players.find(p => p.id === editing.id) ? 'Editar' : 'Novo'} Jogador</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Nome" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <Input placeholder="Classe" value={editing.className} onChange={e => setEditing({ ...editing, className: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Nível</label><Input type="number" min={1} value={editing.level} onChange={e => setEditing({ ...editing, level: parseInt(e.target.value) || 1 })} /></div>
                <div><label className="text-xs text-muted-foreground">HP</label><Input type="number" value={editing.hp} onChange={e => setEditing({ ...editing, hp: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="text-xs text-muted-foreground">HP Máx</label><Input type="number" value={editing.maxHp} onChange={e => setEditing({ ...editing, maxHp: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">CA (Classe de Armadura)</label><Input type="number" value={editing.ca} onChange={e => setEditing({ ...editing, ca: parseInt(e.target.value) || 0 })} /></div>
              <Input placeholder="Notas" value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
              <Button onClick={save} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Players;
