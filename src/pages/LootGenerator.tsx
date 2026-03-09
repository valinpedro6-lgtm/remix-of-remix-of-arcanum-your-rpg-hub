import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Dices, Trash2, Sparkles, Gem, Shield, Sword, FlaskConical, BookOpen, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const RARITY_INFO: Record<Rarity, { label: string; color: string; emoji: string }> = {
  comum: { label: 'Comum', color: 'text-muted-foreground', emoji: '⚪' },
  incomum: { label: 'Incomum', color: 'text-green-400', emoji: '🟢' },
  raro: { label: 'Raro', color: 'text-blue-400', emoji: '🔵' },
  muito_raro: { label: 'Muito Raro', color: 'text-purple-400', emoji: '🟣' },
  lendario: { label: 'Lendário', color: 'text-yellow-400', emoji: '🟡' },
};

const TYPE_ICON: Record<LootType, typeof Sword> = {
  arma: Sword, armadura: Shield, pocao: FlaskConical, pergaminho: BookOpen,
  anel: Gem, amuleto: Crown, gema: Gem, moedas: Coins, misc: Sparkles,
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

const ENCOUNTER_TYPES = [
  { value: 'facil', label: 'Encontro Fácil' },
  { value: 'medio', label: 'Encontro Médio' },
  { value: 'dificil', label: 'Encontro Difícil' },
  { value: 'mortal', label: 'Encontro Mortal' },
  { value: 'tesouro', label: 'Baú de Tesouro' },
  { value: 'boss', label: 'Boss / Chefão' },
];

const LEVELS = ['1-4', '5-10', '11-16', '17-20'];

function getRarityForEncounter(encounter: string, level: string): Rarity {
  const rarities: Rarity[] = ['comum', 'incomum', 'raro', 'muito_raro', 'lendario'];
  const levelIdx = LEVELS.indexOf(level);
  const encBonus: Record<string, number> = { facil: 0, medio: 0, dificil: 1, mortal: 1, tesouro: 1, boss: 2 };
  const base = Math.min(4, levelIdx + (encBonus[encounter] || 0));
  const roll = rollD(100);
  if (roll <= 40) return rarities[Math.max(0, base - 1)];
  if (roll <= 75) return rarities[Math.min(4, base)];
  if (roll <= 92) return rarities[Math.min(4, base + 1)];
  return rarities[Math.min(4, base + 2)];
}

function generateGold(encounter: string, level: string): number {
  const levelIdx = LEVELS.indexOf(level);
  const multipliers: Record<string, number> = { facil: 1, medio: 2, dificil: 3, mortal: 5, tesouro: 4, boss: 8 };
  const base = [rollDice(2, 6), rollDice(4, 6) * 5, rollDice(3, 6) * 50, rollDice(4, 6) * 500][levelIdx] || rollDice(2, 6);
  return Math.floor(base * (multipliers[encounter] || 1));
}

function generateLoot(encounter: string, level: string): LootDrop {
  const itemCount = encounter === 'facil' ? rollD(2) : encounter === 'medio' ? rollD(3) : encounter === 'boss' ? rollD(4) + 2 : rollD(3) + 1;
  const types: LootType[] = ['arma', 'armadura', 'pocao', 'pergaminho', 'anel', 'amuleto', 'gema', 'misc'];
  const items: LootItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const type = pick(types);
    const rarity = getRarityForEncounter(encounter, level);
    const table = LOOT_TABLES[type][rarity];
    const name = pick(table);
    const values: Record<Rarity, string> = {
      comum: `${rollDice(1, 6) * 10} PO`,
      incomum: `${rollDice(2, 6) * 50} PO`,
      raro: `${rollDice(2, 6) * 500} PO`,
      muito_raro: `${rollDice(2, 4) * 5000} PO`,
      lendario: `${rollDice(2, 6) * 25000} PO`,
    };
    items.push({
      id: crypto.randomUUID(),
      name, type, rarity,
      description: `${RARITY_INFO[rarity].label} — ${name}`,
      value: values[rarity],
    });
  }

  return {
    id: crypto.randomUUID(),
    level, encounter,
    items,
    gold: generateGold(encounter, level),
    timestamp: Date.now(),
  };
}

const LootGenerator = () => {
  const [level, setLevel] = useState('1-4');
  const [encounter, setEncounter] = useState('medio');
  const [history, setHistory] = useLocalStorage<LootDrop[]>('arcanum-loot-history', []);
  const [currentDrop, setCurrentDrop] = useState<LootDrop | null>(null);

  const generate = () => {
    const drop = generateLoot(encounter, level);
    setCurrentDrop(drop);
    setHistory(prev => [drop, ...prev.slice(0, 19)]);
  };

  const clearHistory = () => { setHistory([]); setCurrentDrop(null); };

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Gerador de Loot
      </motion.h1>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="card-hover glow-border">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            <Button onClick={generate} className="w-full gap-2" size="lg">
              <Dices className="w-5 h-5" />Gerar Tesouro
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Drop */}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-display font-semibold text-lg">Tesouro Encontrado</h3>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    {currentDrop.gold} PO
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentDrop.items.map((item, i) => {
                    const rInfo = RARITY_INFO[item.rarity];
                    const Icon = TYPE_ICON[item.type];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30"
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

      {/* History */}
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
