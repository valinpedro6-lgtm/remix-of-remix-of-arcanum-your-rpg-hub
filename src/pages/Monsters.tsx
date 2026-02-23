import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Skull, Shield, Heart, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Monster {
  id: string;
  name: string;
  image: string;
  hp: number;
  ca: number;
  attacks: string;
  abilities: string;
  notes: string;
}

const ATTACK_SUGGESTIONS = [
  'Mordida +5, 2d6+3 perfurante',
  'Garras +4, 1d8+2 cortante',
  'Cauda +3, 1d10+1 contundente',
  'Sopro de Fogo (CD 13), 4d6 fogo',
  'Sopro Gélido (CD 12), 3d8 gelo',
  'Teia (CD 11), restringido',
  'Investida +6, 2d8+4 contundente',
  'Ferrão +5, 1d4+3 perfurante + 2d6 veneno',
  'Raio Ocular (CD 14), 3d10 necrótico',
  'Esmagamento +7, 2d10+5 contundente',
];

const ABILITY_SUGGESTIONS = [
  'Visão no Escuro 18m',
  'Resistência a Magia',
  'Regeneração 5 HP/turno',
  'Imunidade a Veneno',
  'Voo 12m',
  'Faro Aguçado',
  'Camuflagem (vantagem em furtividade)',
  'Resistência a Dano Não-mágico',
  'Aura de Medo (CD 12)',
  'Sentido Sísmico 9m',
];

const emptyMonster = (): Monster => ({
  id: crypto.randomUUID(), name: '', image: '', hp: 10, ca: 10, attacks: '', abilities: '', notes: '',
});

const Monsters = () => {
  const [monsters, setMonsters] = useLocalStorage<Monster[]>('arcanum-monsters', []);
  const [editing, setEditing] = useState<Monster | null>(null);
  const [open, setOpen] = useState(false);

  const save = () => {
    if (!editing?.name.trim()) return;
    setMonsters(prev => {
      const exists = prev.find(m => m.id === editing.id);
      return exists ? prev.map(m => m.id === editing.id ? editing : m) : [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => setMonsters(prev => prev.filter(m => m.id !== id));

  const addAttack = (attack: string) => {
    if (!editing) return;
    const current = editing.attacks.trim();
    setEditing({ ...editing, attacks: current ? `${current}\n${attack}` : attack });
  };

  const addAbility = (ability: string) => {
    if (!editing) return;
    const current = editing.abilities.trim();
    setEditing({ ...editing, abilities: current ? `${current}\n${ability}` : ability });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Monstros</h1>
        <Button onClick={() => { setEditing(emptyMonster()); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
      </div>

      {monsters.length === 0 && (
        <Card className="card-hover"><CardContent className="p-8 text-center text-muted-foreground">Nenhum monstro cadastrado</CardContent></Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {monsters.map(m => (
          <Card key={m.id} className="card-hover overflow-hidden">
            <CardContent className="p-0">
              {m.image ? (
                <div className="h-40 bg-secondary overflow-hidden"><img src={m.image} alt={m.name} className="w-full h-full object-cover" /></div>
              ) : (
                <div className="h-40 bg-secondary flex items-center justify-center"><Skull className="w-16 h-16 text-muted-foreground/30" /></div>
              )}
              <div className="p-4 space-y-3">
                <h3 className="text-xl font-display font-bold">{m.name}</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-accent" /><span className="font-semibold">{m.hp}</span></div>
                  <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /><span className="font-semibold">{m.ca}</span></div>
                </div>
                {m.attacks && <div><p className="text-xs text-muted-foreground">Ataques</p><p className="text-sm whitespace-pre-line">{m.attacks}</p></div>}
                {m.abilities && <div><p className="text-xs text-muted-foreground">Habilidades</p><p className="text-sm whitespace-pre-line">{m.abilities}</p></div>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing({ ...m }); setOpen(true); }} className="flex-1"><Edit className="w-3 h-3 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => remove(m.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing && monsters.find(m => m.id === editing.id) ? 'Editar' : 'Novo'} Monstro</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Nome" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <Input placeholder="URL da Imagem" value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">HP</label><Input type="number" value={editing.hp} onChange={e => setEditing({ ...editing, hp: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="text-xs text-muted-foreground">CA</label><Input type="number" value={editing.ca} onChange={e => setEditing({ ...editing, ca: parseInt(e.target.value) || 0 })} /></div>
              </div>

              <div>
                <Textarea placeholder="Ataques (ex: Mordida +5, 2d6+3)" value={editing.attacks} onChange={e => setEditing({ ...editing, attacks: e.target.value })} />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" />Sugestões de ataque:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ATTACK_SUGGESTIONS.map(a => (
                      <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors text-xs" onClick={() => addAttack(a)}>
                        {a.split(',')[0]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Textarea placeholder="Habilidades especiais" value={editing.abilities} onChange={e => setEditing({ ...editing, abilities: e.target.value })} />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Sugestões de habilidade:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ABILITY_SUGGESTIONS.map(a => (
                      <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors text-xs" onClick={() => addAbility(a)}>
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Input placeholder="Notas" value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
              <Button onClick={save} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Monsters;
