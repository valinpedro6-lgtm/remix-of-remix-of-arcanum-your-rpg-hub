import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Coins, Dices, Trash2, Sparkles, Gem, Shield, Sword, FlaskConical, BookOpen, Crown,
  Copy, Star, RefreshCw, Download, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rollD = (sides: number) => Math.floor(Math.random() * sides) + 1;
const rollDice = (count: number, sides: number) => {
  let total = 0;
  for (let i = 0; i < count; i++) total += rollD(sides);
  return total;
};

type Rarity = 'comum' | 'incomum' | 'raro' | 'muito_raro' | 'lendario';
type LootType = 'arma' | 'armadura' | 'pocao' | 'pergaminho' | 'anel' | 'amuleto' | 'gema' | 'moedas' | 'misc';

interface LootItem {
  id: string;
  name: string;
  type: LootType;
  rarity: Rarity;
  description: string;
  value: string;
}

interface LootDrop {
  id: string;
  level: string;
  encounter: string;
  items: LootItem[];
  gold: number;
  timestamp: number;
}

const RARITY_INFO: Record<Rarity, { label: string; color: string; emoji: string; ring: string }> = {
  comum: { label: 'Comum', color: 'text-muted-foreground', emoji: '⚪', ring: 'border-border/40' },
  incomum: { label: 'Incomum', color: 'text-green-400', emoji: '🟢', ring: 'border-green-500/40' },
  raro: { label: 'Raro', color: 'text-blue-400', emoji: '🔵', ring: 'border-blue-500/40' },
  muito_raro: { label: 'Muito Raro', color: 'text-purple-400', emoji: '🟣', ring: 'border-purple-500/40' },
  lendario: { label: 'Lendário', color: 'text-yellow-400', emoji: '🟡', ring: 'border-yellow-500/50' },
};

const TYPE_ICON: Record<LootType, typeof Sword> = {
  arma: Sword, armadura: Shield, pocao: FlaskConical, pergaminho: BookOpen,
  anel: Gem, amuleto: Crown, gema: Gem, moedas: Coins, misc: Sparkles,
};

const TYPE_LABEL: Record<LootType, string> = {
  arma: 'Armas', armadura: 'Armaduras', pocao: 'Poções', pergaminho: 'Pergaminhos',
  anel: 'Anéis', amuleto: 'Amuletos', gema: 'Gemas', moedas: 'Moedas', misc: 'Diversos',
};

const LOOT_TABLES: Record<LootType, Record<Rarity, string[]>> = {
  arma: {
    comum: ['Espada Curta', 'Adaga de Ferro', 'Arco Simples', 'Maça de Madeira', 'Lança de Caçador'],
    incomum: ['Espada Longa +1', 'Arco Élfico', 'Machado Anão', 'Florete Encantado', 'Besta de Precisão'],
    raro: ['Lâmina Flamejante', 'Arco do Caçador de Dragões', 'Martelo Trovejante', 'Alabarda Fantasma', 'Adaga Venenosa'],
    muito_raro: ['Espada Vorpal', 'Arco Solar', 'Machado do Berserker Eterno', 'Lança do Destino'],
    lendario: ['Excalibur', 'Mjölnir', 'Lâmina do Infinito', 'Arco dos Deuses Antigos'],
  },
  armadura: {
    comum: ['Armadura de Couro', 'Escudo de Madeira', 'Elmo de Ferro', 'Cota de Malha Velha'],
    incomum: ['Cota de Malha +1', 'Escudo de Aço', 'Armadura de Escamas', 'Elmo da Vigilância'],
    raro: ['Armadura de Mithril', 'Escudo Espelhado', 'Armadura do Dragão', 'Elmo da Visão Verdadeira'],
    muito_raro: ['Armadura de Adamantina', 'Escudo Animado', 'Manto da Resistência'],
    lendario: ['Armadura dos Deuses', 'Escudo Invencível', 'Manto da Invisibilidade'],
  },
  pocao: {
    comum: ['Poção de Cura', 'Antídoto', 'Poção de Escalada'],
    incomum: ['Poção de Cura Maior', 'Poção de Força do Gigante', 'Poção de Resistência ao Fogo'],
    raro: ['Poção de Voo', 'Poção de Invisibilidade', 'Poção de Heroísmo'],
    muito_raro: ['Poção de Cura Suprema', 'Poção de Velocidade', 'Elixir da Vida'],
    lendario: ['Poção da Imortalidade', 'Elixir dos Deuses'],
  },
  pergaminho: {
    comum: ['Pergaminho de Luz', 'Pergaminho de Detectar Magia', 'Pergaminho de Cura'],
    incomum: ['Pergaminho de Bola de Fogo', 'Pergaminho de Invisibilidade', 'Pergaminho de Voo'],
    raro: ['Pergaminho de Teletransporte', 'Pergaminho de Dissipar Magia Maior', 'Pergaminho de Ressurreição'],
    muito_raro: ['Pergaminho de Desejo Limitado', 'Pergaminho de Portão'],
    lendario: ['Pergaminho de Desejo', 'Pergaminho do Apocalipse'],
  },
  anel: {
    comum: ['Anel de Prata', 'Anel de Cobre Decorado'],
    incomum: ['Anel de Proteção +1', 'Anel de Natação', 'Anel de Escudo Arcano'],
    raro: ['Anel de Invisibilidade', 'Anel de Resistência Elemental', 'Anel de Telecinese'],
    muito_raro: ['Anel de Regeneração', 'Anel de Armazenamento de Magia'],
    lendario: ['Anel de Três Desejos', 'Anel do Poder Absoluto'],
  },
  amuleto: {
    comum: ['Amuleto de Osso', 'Pingente de Pedra'],
    incomum: ['Amuleto contra Detecção', 'Amuleto de Saúde', 'Colar de Bolas de Fogo'],
    raro: ['Amuleto de Prova contra Veneno', 'Broche de Proteção', 'Pérola do Poder'],
    muito_raro: ['Amuleto dos Planos', 'Tomo de Sabedoria'],
    lendario: ['Amuleto do Controle Temporal', 'Coração do Dragão Ancião'],
  },
  gema: {
    comum: ['Ágata', 'Quartzo', 'Turquesa', 'Obsidiana'],
    incomum: ['Ametista', 'Jade', 'Pérola', 'Coral'],
    raro: ['Safira', 'Esmeralda', 'Rubi', 'Topázio'],
    muito_raro: ['Diamante Negro', 'Opala de Fogo', 'Alexandrita'],
    lendario: ['Diamante Estelar', 'Rubi do Dragão', 'Pedra do Infinito'],
  },
  moedas: { comum: ['PC'], incomum: ['PP'], raro: ['PE'], muito_raro: ['PO'], lendario: ['PL'] },
  misc: {
    comum: ['Corda Encantada', 'Pedra de Luz', 'Saco Sem Fundo Pequeno'],
    incomum: ['Botas Élficas', 'Capa da Proteção', 'Mochila de Carga', 'Luneta Mágica'],
    raro: ['Tapete Voador', 'Baú Dimensional', 'Espelho da Verdade'],
    muito_raro: ['Esfera de Aniquilação', 'Cubo de Força'],
    lendario: ['Deck de Muitas Coisas', 'Livro Vil'],
  },
};

/** sabor extra por raridade — deixa o item mais "vivo" na mesa */
const FLAVORS = [
  'Está frio ao toque, mesmo perto do fogo.',
  'Traz uma inscrição em língua morta na base.',
  'Pertenceu a alguém que morreu mal — dá pra sentir.',
  'Emite um zumbido baixo quando há magia por perto.',
  'Tem manchas escuras que não saem de jeito nenhum.',
  'Parece novo demais para o lugar onde foi achado.',
  'Vibra de leve quando alguém mente por perto.',
  'Cheira levemente a incenso e ferrugem.',
];

const ENCOUNTER_TYPES = [
  { value: 'facil', label: 'Encontro Fácil' },
  { value: 'medio', label: 'Encontro Médio' },
  { value: 'dificil', label: 'Encontro Difícil' },
  { value: 'mortal', label: 'Encontro Mortal' },
  { value: 'tesouro', label: 'Baú de Tesouro' },
  { value: 'boss', label: 'Boss / Chefão' },
];

const LEVELS = ['1-4', '5-10', '11-16', '17-20'];
const ALL_TYPES: LootType[] = ['arma', 'armadura', 'pocao', 'pergaminho', 'anel', 'amuleto', 'gema', 'misc'];

function getRarityForEncounter(encounter: string, level: string, boost: number): Rarity {
  const rarities: Rarity[] = ['comum', 'incomum', 'raro', 'muito_raro', 'lendario'];
  const levelIdx = LEVELS.indexOf(level);
  const encBonus: Record<string, number> = { facil: 0, medio: 0, dificil: 1, mortal: 1, tesouro: 1, boss: 2 };
  const base = Math.min(4, levelIdx + (encBonus[encounter] || 0) + boost);
  const roll = rollD(100);
  if (roll <= 40) return rarities[Math.max(0, base - 1)];
  if (roll <= 75) return rarities[Math.min(4, Math.max(0, base))];
  if (roll <= 92) return rarities[Math.min(4, base + 1)];
  return rarities[Math.min(4, base + 2)];
}

function generateGold(encounter: string, level: string): number {
  const levelIdx = LEVELS.indexOf(level);
  const multipliers: Record<string, number> = { facil: 1, medio: 2, dificil: 3, mortal: 5, tesouro: 4, boss: 8 };
  const base = [rollDice(2, 6), rollDice(4, 6) * 5, rollDice(3, 6) * 50, rollDice(4, 6) * 500][levelIdx] || rollDice(2, 6);
  return Math.floor(base * (multipliers[encounter] || 1));
}

function makeItem(types: LootType[], encounter: string, level: string, boost: number): LootItem {
  const type = pick(types.length ? types : ALL_TYPES);
  const rarity = getRarityForEncounter(encounter, level, boost);
  const name = pick(LOOT_TABLES[type][rarity]);
  const values: Record<Rarity, string> = {
    comum: `${rollDice(1, 6) * 10} PO`,
    incomum: `${rollDice(2, 6) * 50} PO`,
    raro: `${rollDice(2, 6) * 500} PO`,
    muito_raro: `${rollDice(2, 4) * 5000} PO`,
    lendario: `${rollDice(2, 6) * 25000} PO`,
  };
  return {
    id: crypto.randomUUID(),
    name, type, rarity,
    description: pick(FLAVORS),
    value: values[rarity],
  };
}

function generateLoot(
  encounter: string, level: string, types: LootType[], boost: number, count: number | null, withGold: boolean,
): LootDrop {
  const itemCount = count ?? (
    encounter === 'facil' ? rollD(2)
    : encounter === 'medio' ? rollD(3)
    : encounter === 'boss' ? rollD(4) + 2
    : rollD(3) + 1
  );
  const items = Array.from({ length: itemCount }, () => makeItem(types, encounter, level, boost));
  return {
    id: crypto.randomUUID(),
    level, encounter, items,
    gold: withGold ? generateGold(encounter, level) : 0,
    timestamp: Date.now(),
  };
}

const dropToText = (drop: LootDrop) => {
  const enc = ENCOUNTER_TYPES.find(e => e.value === drop.encounter)?.label ?? drop.encounter;
  const lines = [
    `${enc} — Nível ${drop.level}`,
    drop.gold ? `Moedas: ${drop.gold} PO` : null,
    ...drop.items.map(i => `• ${i.name} [${RARITY_INFO[i.rarity].label}] — ${i.value} (${i.description})`),
  ].filter(Boolean);
  return lines.join('\n');
};

const copy = async (text: string, title = 'Copiado!') => {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title });
  } catch {
    toast({ title: 'Não foi possível copiar', variant: 'destructive' });
  }
};

const LootGenerator = () => {
  const [level, setLevel] = useState('1-4');
  const [encounter, setEncounter] = useState('medio');
  const [types, setTypes] = useState<LootType[]>(ALL_TYPES);
  const [boost, setBoost] = useState(0);
  const [autoCount, setAutoCount] = useState(true);
  const [count, setCount] = useState(3);
  const [withGold, setWithGold] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [history, setHistory] = useLocalStorage<LootDrop[]>('arcanum-loot-history', []);
  const [favorites, setFavorites] = useLocalStorage<LootItem[]>('arcanum-loot-favorites', []);
  const [currentDrop, setCurrentDrop] = useState<LootDrop | null>(null);

  const generate = () => {
    const drop = generateLoot(encounter, level, types, boost, autoCount ? null : count, withGold);
    setCurrentDrop(drop);
    setHistory(prev => [drop, ...prev.slice(0, 19)]);
  };

  const rerollItem = (id: string) => {
    setCurrentDrop(prev => prev && ({
      ...prev,
      items: prev.items.map(i => (i.id === id ? makeItem(types, encounter, level, boost) : i)),
    }));
  };

  const removeItem = (id: string) =>
    setCurrentDrop(prev => prev && ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  const toggleFav = (item: LootItem) => {
    setFavorites(prev => prev.some(f => f.id === item.id)
      ? prev.filter(f => f.id !== item.id)
      : [item, ...prev].slice(0, 60));
  };

  const isFav = (id: string) => favorites.some(f => f.id === id);

  const exportDrop = () => {
    if (!currentDrop) return;
    const blob = new Blob([dropToText(currentDrop)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arcanum-tesouro.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearHistory = () => { setHistory([]); setCurrentDrop(null); };

  const toggleType = (t: LootType) =>
    setTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Gerador de Loot
      </motion.h1>

      {/* Controles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="card-hover glow-border">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Nível do Grupo</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l} value={l}>Nível {l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tipo de Encontro</label>
                <Select value={encounter} onValueChange={setEncounter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENCOUNTER_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"
              onClick={() => setShowFilters(f => !f)}>
              <Filter className="w-4 h-4" />{showFilters ? 'Ocultar ajustes' : 'Ajustes avançados'}
            </Button>

            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Categorias sorteadas</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_TYPES.map(t => {
                        const Icon = TYPE_ICON[t];
                        const on = types.includes(t);
                        return (
                          <button key={t} onClick={() => toggleType(t)}
                            className={`flex items-center gap-1.5 px-3 h-9 rounded-full border text-xs font-semibold transition ${
                              on ? 'bg-primary/15 border-primary text-primary' : 'border-border/60 text-muted-foreground'
                            }`}>
                            <Icon className="w-3.5 h-3.5" />{TYPE_LABEL[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sorte / bônus de raridade</span>
                      <Badge variant="outline">+{boost}</Badge>
                    </div>
                    <Slider value={[boost]} onValueChange={v => setBoost(v[0])} min={0} max={3} step={1} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <span className="text-sm">Quantidade automática</span>
                    <Switch checked={autoCount} onCheckedChange={setAutoCount} />
                  </div>

                  {!autoCount && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Itens no tesouro</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                      <Slider value={[count]} onValueChange={v => setCount(v[0])} min={1} max={12} step={1} />
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <span className="text-sm">Incluir moedas</span>
                    <Switch checked={withGold} onCheckedChange={setWithGold} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button onClick={generate} className="w-full gap-2" size="lg">
              <Dices className="w-5 h-5" />Gerar Tesouro
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tesouro atual */}
      <AnimatePresence mode="wait">
        {currentDrop && (
          <motion.div
            key={currentDrop.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="glow-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-display font-semibold text-lg">Tesouro Encontrado</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentDrop.gold > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Coins className="w-3 h-3 text-yellow-400" />{currentDrop.gold} PO
                      </Badge>
                    )}
                    <Button size="icon" variant="ghost" className="h-9 w-9" title="Copiar tudo"
                      onClick={() => copy(dropToText(currentDrop), 'Tesouro copiado!')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9" title="Exportar .txt" onClick={exportDrop}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {currentDrop.items.map((item, i) => {
                    const rInfo = RARITY_INFO[item.rarity];
                    const Icon = TYPE_ICON[item.type];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border ${rInfo.ring}`}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{item.name}</span>
                            <span className="text-xs">{rInfo.emoji}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold ${rInfo.color}`}>{rInfo.label}</span>
                            <span className="text-[10px] text-muted-foreground">• {item.value}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic mt-1">{item.description}</p>
                        </div>
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Favoritar"
                            onClick={() => toggleFav(item)}>
                            <Star className={`w-3.5 h-3.5 ${isFav(item.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Re-rolar item"
                            onClick={() => rerollItem(item.id)}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Descartar"
                            onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favoritos */}
      {favorites.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />Itens favoritos
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setFavorites([])}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favorites.map(f => (
                <button key={f.id} onClick={() => copy(`${f.name} [${RARITY_INFO[f.rarity].label}] — ${f.value}`)}
                  className="px-3 h-9 rounded-full border border-border/60 text-xs font-semibold hover:border-primary transition flex items-center gap-1.5">
                  <span>{RARITY_INFO[f.rarity].emoji}</span>{f.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Histórico de Loot</h3>
                <Button variant="ghost" size="sm" onClick={clearHistory}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map(drop => {
                  const enc = ENCOUNTER_TYPES.find(e => e.value === drop.encounter);
                  return (
                    <div
                      key={drop.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setCurrentDrop(drop)}
                    >
                      <div>
                        <span className="text-sm font-semibold">{enc?.label || drop.encounter}</span>
                        <span className="text-xs text-muted-foreground ml-2">Nv. {drop.level}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{drop.items.length} itens</span>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Coins className="w-3 h-3 text-yellow-400" />{drop.gold}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default LootGenerator;
