import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sword, Crosshair, Plus, Dices, Trash2, Pencil } from 'lucide-react';

interface Weapon {
  id: string;
  name: string;
  description: string;
  diceCount: number;
  diceSides: number;
  modifier: number;
  category: 'medieval' | 'modern';
  custom?: boolean;
}

const DEFAULT_WEAPONS: Weapon[] = [
  { id: 'm1', name: 'Espada Longa', description: 'Arma versátil de uma ou duas mãos', diceCount: 1, diceSides: 8, modifier: 0, category: 'medieval' },
  { id: 'm2', name: 'Machado de Batalha', description: 'Golpe devastador com lâmina pesada', diceCount: 1, diceSides: 10, modifier: 0, category: 'medieval' },
  { id: 'm3', name: 'Adaga', description: 'Lâmina curta e rápida', diceCount: 1, diceSides: 4, modifier: 0, category: 'medieval' },
  { id: 'm4', name: 'Arco Longo', description: 'Alcance longo e precisão mortal', diceCount: 1, diceSides: 8, modifier: 0, category: 'medieval' },
  { id: 'm5', name: 'Maça', description: 'Arma contundente eficaz contra armaduras', diceCount: 1, diceSides: 6, modifier: 0, category: 'medieval' },
  { id: 'm6', name: 'Lança', description: 'Alcance e versatilidade em combate', diceCount: 1, diceSides: 6, modifier: 0, category: 'medieval' },
  { id: 'm7', name: 'Martelo de Guerra', description: 'Impacto devastador, bom contra armaduras', diceCount: 1, diceSides: 8, modifier: 0, category: 'medieval' },
  { id: 'm8', name: 'Besta', description: 'Disparo poderoso com recarga lenta', diceCount: 1, diceSides: 10, modifier: 0, category: 'medieval' },
  { id: 'm9', name: 'Florete', description: 'Arma leve e precisa para estocadas', diceCount: 1, diceSides: 8, modifier: 0, category: 'medieval' },
  { id: 'm10', name: 'Alabarda', description: 'Arma de haste com lâmina e gancho', diceCount: 1, diceSides: 10, modifier: 0, category: 'medieval' },
  { id: 'm11', name: 'Tocha', description: 'Improvisada, causa dano de fogo', diceCount: 1, diceSides: 4, modifier: 1, category: 'medieval' },
  { id: 'm12', name: 'Corrente', description: 'Arma improvisada com alcance', diceCount: 1, diceSides: 6, modifier: 0, category: 'medieval' },
  { id: 'm13', name: 'Garrafa Quebrada', description: 'Arma improvisada de taverna', diceCount: 1, diceSides: 4, modifier: 0, category: 'medieval' },
  { id: 'm14', name: 'Cadeira', description: 'Arma improvisada contundente', diceCount: 1, diceSides: 4, modifier: 1, category: 'medieval' },
  { id: 'm15', name: 'Montante', description: 'Espada enorme de duas mãos', diceCount: 2, diceSides: 6, modifier: 0, category: 'medieval' },
  { id: 'a1', name: 'Pistola 9mm', description: 'Arma de fogo semiautomática padrão', diceCount: 2, diceSides: 6, modifier: 0, category: 'modern' },
  { id: 'a2', name: 'Revólver .357', description: 'Revólver potente de seis tiros', diceCount: 2, diceSides: 8, modifier: 0, category: 'modern' },
  { id: 'a3', name: 'Espingarda', description: 'Dano massivo a curta distância', diceCount: 2, diceSides: 8, modifier: 2, category: 'modern' },
  { id: 'a4', name: 'Rifle de Assalto', description: 'Rajadas automáticas de alta cadência', diceCount: 2, diceSides: 6, modifier: 2, category: 'modern' },
  { id: 'a5', name: 'Submetralhadora', description: 'Compacta com alta cadência de tiro', diceCount: 2, diceSides: 4, modifier: 1, category: 'modern' },
  { id: 'a6', name: 'Rifle de Precisão', description: 'Longo alcance, dano crítico', diceCount: 2, diceSides: 10, modifier: 4, category: 'modern' },
  { id: 'a7', name: 'Canivete', description: 'Lâmina curta escondida', diceCount: 1, diceSides: 4, modifier: 0, category: 'modern' },
  { id: 'a8', name: 'Bastão Retrátil', description: 'Arma contundente portátil', diceCount: 1, diceSides: 6, modifier: 0, category: 'modern' },
  { id: 'a9', name: 'Taser', description: 'Arma de choque não letal', diceCount: 1, diceSides: 4, modifier: 0, category: 'modern' },
  { id: 'a10', name: 'Granada', description: 'Explosivo de área', diceCount: 3, diceSides: 6, modifier: 0, category: 'modern' },
];

const Weapons = () => {
  const [customWeapons, setCustomWeapons] = useLocalStorage<Weapon[]>('arcanum-weapons-custom', []);
  const [overrides, setOverrides] = useLocalStorage<Record<string, { diceCount: number; diceSides: number; modifier: number }>>('arcanum-weapons-overrides', {});
  const [results, setResults] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editIsCustom, setEditIsCustom] = useState(false);
  const [tab, setTab] = useState<'medieval' | 'modern'>('medieval');
  const [form, setForm] = useState<Weapon>({ id: '', name: '', description: '', diceCount: 1, diceSides: 6, modifier: 0, category: 'medieval', custom: true });

  const getWeapon = (w: Weapon): Weapon => {
    const ov = overrides[w.id];
    return ov ? { ...w, diceCount: ov.diceCount, diceSides: ov.diceSides, modifier: ov.modifier } : w;
  };

  const allWeapons = [...DEFAULT_WEAPONS.map(getWeapon), ...customWeapons];

  const rollWeapon = (w: Weapon) => {
    if (w.diceCount === 0) return;
    const rolls = Array.from({ length: w.diceCount }, () => Math.floor(Math.random() * w.diceSides) + 1);
    setResults(prev => ({ ...prev, [w.id]: rolls.reduce((a, b) => a + b, 0) + w.modifier }));
  };

  const formula = (w: Weapon) =>
    w.diceCount > 0 ? `${w.diceCount}d${w.diceSides}${w.modifier ? (w.modifier > 0 ? '+' : '') + w.modifier : ''}` : 'Efeito fixo';

  const openNew = () => {
    setEditId(null);
    setEditIsCustom(false);
    setForm({ id: '', name: '', description: '', diceCount: 1, diceSides: 6, modifier: 0, category: tab, custom: true });
    setOpen(true);
  };

  const openEdit = (w: Weapon, isCustom: boolean) => {
    setEditId(w.id);
    setEditIsCustom(isCustom);
    setForm({ ...w });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      if (editIsCustom) {
        setCustomWeapons(prev => prev.map(w => w.id === editId ? { ...form, id: editId } : w));
      } else {
        // Save dice override for default weapon
        setOverrides(prev => ({ ...prev, [editId]: { diceCount: form.diceCount, diceSides: form.diceSides, modifier: form.modifier } }));
      }
    } else {
      setCustomWeapons(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setOpen(false);
  };

  const filtered = allWeapons.filter(w => w.category === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Armas</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Arma</Button>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'medieval' | 'modern')}>
        <TabsList>
          <TabsTrigger value="medieval" className="gap-1.5"><Sword className="w-4 h-4" />Medieval</TabsTrigger>
          <TabsTrigger value="modern" className="gap-1.5"><Crosshair className="w-4 h-4" />Moderna</TabsTrigger>
        </TabsList>

        {(['medieval', 'modern'] as const).map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(w => {
                const Icon = cat === 'medieval' ? Sword : Crosshair;
                const isCustom = !!w.custom;
                return (
                  <Card key={w.id} className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                          <div>
                            <h3 className="font-display font-semibold">{w.name}</h3>
                            <p className="text-xs text-muted-foreground">{w.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(w, isCustom)}><Pencil className="w-3 h-3" /></Button>
                          {isCustom && (
                            <Button variant="ghost" size="icon" onClick={() => setCustomWeapons(prev => prev.filter(cw => cw.id !== w.id))}><Trash2 className="w-3 h-3" /></Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-muted-foreground">{formula(w)}</span>
                        <div className="flex items-center gap-2">
                          {results[w.id] !== undefined && <span className="text-lg font-display font-bold text-primary">{results[w.id]}</span>}
                          {w.diceCount > 0 && <Button size="sm" variant="outline" onClick={() => rollWeapon(w)}><Dices className="w-3 h-3 mr-1" />Rolar</Button>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">{editId ? 'Editar Arma' : 'Nova Arma'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(editIsCustom || !editId) && (
              <>
                <Input placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </>
            )}
            {editId && !editIsCustom && (
              <p className="text-sm text-muted-foreground">Editando dados de <span className="font-semibold text-foreground">{form.name}</span></p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Dados</label><Input type="number" min={0} value={form.diceCount} onChange={e => setForm(p => ({ ...p, diceCount: parseInt(e.target.value) || 0 }))} /></div>
              <div><label className="text-xs text-muted-foreground">Lados</label><Input type="number" min={2} value={form.diceSides} onChange={e => setForm(p => ({ ...p, diceSides: parseInt(e.target.value) || 6 }))} /></div>
              <div><label className="text-xs text-muted-foreground">Mod</label><Input type="number" value={form.modifier} onChange={e => setForm(p => ({ ...p, modifier: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            {(editIsCustom || !editId) && (
              <div>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Tabs value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as 'medieval' | 'modern' }))}>
                  <TabsList className="w-full">
                    <TabsTrigger value="medieval" className="flex-1">Medieval</TabsTrigger>
                    <TabsTrigger value="modern" className="flex-1">Moderna</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            <Button onClick={save} className="w-full">{editId ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Weapons;
