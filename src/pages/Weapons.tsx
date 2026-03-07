import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sword, Crosshair, Plus, Dices, Trash2, Pencil, Search, Copy } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [results, setResults] = useState<Record<string, { value: number; rolls: number[] }>>({});
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editIsCustom, setEditIsCustom] = useState(false);
  const [tab, setTab] = useState<'medieval' | 'modern'>('medieval');
  const [form, setForm] = useState<Weapon>({ id: '', name: '', description: '', diceCount: 1, diceSides: 6, modifier: 0, category: 'medieval', custom: true });
  const [search, setSearch] = useState('');

  const getWeapon = (w: Weapon): Weapon => {
    const ov = overrides[w.id];
    return ov ? { ...w, diceCount: ov.diceCount, diceSides: ov.diceSides, modifier: ov.modifier } : w;
  };

  const allWeapons = [...DEFAULT_WEAPONS.map(getWeapon), ...customWeapons];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allWeapons.filter(w => w.category === tab && (!q || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)));
  }, [allWeapons, tab, search]);

  const rollWeapon = (w: Weapon) => {
    if (w.diceCount === 0) return;
    const rolls = Array.from({ length: w.diceCount }, () => Math.floor(Math.random() * w.diceSides) + 1);
    setResults(prev => ({ ...prev, [w.id]: { value: rolls.reduce((a, b) => a + b, 0) + w.modifier, rolls } }));
  };

  const formula = (w: Weapon) =>
    w.diceCount > 0 ? `${w.diceCount}d${w.diceSides}${w.modifier ? (w.modifier > 0 ? '+' : '') + w.modifier : ''}` : 'Efeito fixo';

  const openNew = () => {
    setEditId(null); setEditIsCustom(false);
    setForm({ id: '', name: '', description: '', diceCount: 1, diceSides: 6, modifier: 0, category: tab, custom: true });
    setOpen(true);
  };

  const openEdit = (w: Weapon, isCustom: boolean) => {
    setEditId(w.id); setEditIsCustom(isCustom); setForm({ ...w }); setOpen(true);
  };

  const duplicateWeapon = (w: Weapon) => {
    setCustomWeapons(prev => [...prev, { ...w, id: crypto.randomUUID(), name: `${w.name} (cópia)`, custom: true }]);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      if (editIsCustom) {
        setCustomWeapons(prev => prev.map(w => w.id === editId ? { ...form, id: editId } : w));
      } else {
        setOverrides(prev => ({ ...prev, [editId]: { diceCount: form.diceCount, diceSides: form.diceSides, modifier: form.modifier } }));
      }
    } else {
      setCustomWeapons(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-title">Armas</h1>
        <Button onClick={openNew} className="gap-1"><Plus className="w-4 h-4" />Nova Arma</Button>
      </motion.div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'medieval' | 'modern')}>
        <TabsList>
          <TabsTrigger value="medieval" className="gap-1.5"><Sword className="w-4 h-4" />Medieval</TabsTrigger>
          <TabsTrigger value="modern" className="gap-1.5"><Crosshair className="w-4 h-4" />Moderna</TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar armas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {(['medieval', 'modern'] as const).map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {filtered.map((w, i) => {
                  const Icon = cat === 'medieval' ? Sword : Crosshair;
                  const isCustom = !!w.custom;
                  const result = results[w.id];
                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                      layout
                    >
                      <Card className="card-hover group h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display font-semibold truncate">{w.name}</h3>
                                <p className="text-xs text-muted-foreground">{w.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w, isCustom)}><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateWeapon(w)}><Copy className="w-3 h-3" /></Button>
                              {isCustom && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCustomWeapons(prev => prev.filter(cw => cw.id !== w.id))}><Trash2 className="w-3 h-3" /></Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-muted-foreground font-mono">{formula(w)}</span>
                            <div className="flex items-center gap-2">
                              {result && (
                                <motion.span
                                  key={result.value + '-' + Date.now()}
                                  initial={{ scale: 1.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="text-lg font-display font-bold text-primary"
                                >
                                  {result.value}
                                </motion.span>
                              )}
                              {w.diceCount > 0 && (
                                <Button size="sm" variant="outline" onClick={() => rollWeapon(w)} className="gap-1">
                                  <Dices className="w-3 h-3" />Rolar
                                </Button>
                              )}
                            </div>
                          </div>
                          {result && result.rolls.length > 1 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground mt-1 font-mono">
                              [{result.rolls.join(', ')}]{w.modifier ? ` +${w.modifier}` : ''}
                            </motion.p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
              <div><label className="text-xs text-muted-foreground">Dados</label><NumberInput min={0} value={form.diceCount} onChange={v => setForm(p => ({ ...p, diceCount: v }))} /></div>
              <div><label className="text-xs text-muted-foreground">Lados</label><NumberInput min={2} value={form.diceSides} onChange={v => setForm(p => ({ ...p, diceSides: v }))} /></div>
              <div><label className="text-xs text-muted-foreground">Mod</label><NumberInput value={form.modifier} onChange={v => setForm(p => ({ ...p, modifier: v }))} /></div>
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
