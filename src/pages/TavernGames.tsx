import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dices, Swords, Beer, Target, Trophy, Skull,
  ChevronDown, ChevronUp, RotateCcw, Plus, Trash2, Sparkles, Pencil
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────

interface RollResult {
  value: number;
  die: string;
}

interface GameLog {
  round: number;
  description: string;
  playerRolls: RollResult[];
  opponentRolls?: RollResult[];
  success?: boolean;
}

interface GameState {
  gameId: string;
  gameName: string;
  logs: GameLog[];
  finalResult: string;
  won: boolean | null;
  score?: string;
}

interface CustomGameDef {
  id: string;
  name: string;
  description: string;
  rules: string[];
  diceType: number;
  diceCount: number;
  rounds: number;
  vsOpponent: boolean;
  targetScore: number;
}

// ── Dice helpers ───────────────────────────────────────

const roll = (sides: number): RollResult => ({
  value: Math.floor(Math.random() * sides) + 1,
  die: `d${sides}`,
});

const rollMultiple = (sides: number, count: number): RollResult[] =>
  Array.from({ length: count }, () => roll(sides));

const sum = (rolls: RollResult[]) => rolls.reduce((a, r) => a + r.value, 0);

// ── Animation variants ────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

const resultPanel = {
  initial: { opacity: 0, y: -20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.2 } },
} as const;

const logItem = {
  initial: { opacity: 0, x: -15 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 300, damping: 20 },
  }),
};

const rulesVariant = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto' as const, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

// ── Built-in games ─────────────────────────────────────

interface TavernGame {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  rules: string[];
  dice: string;
  play: () => GameState;
  isCustom?: boolean;
}

const builtInGames: TavernGame[] = [
  {
    id: 'cara-coroa',
    name: 'Cara ou Coroa',
    icon: Dices,
    description: 'Aposte em cara ou coroa — simples e direto.',
    dice: '1d2',
    rules: [
      'Cada jogador aposta em Cara (1) ou Coroa (2).',
      'Role 1d2. O resultado decide.',
      'Empate não existe — sempre há um vencedor.',
    ],
    play: () => {
      const r = roll(2);
      const face = r.value === 1 ? 'Cara' : 'Coroa';
      return {
        gameId: 'cara-coroa', gameName: 'Cara ou Coroa',
        logs: [{ round: 1, description: `A moeda girou e caiu em... ${face}!`, playerRolls: [r] }],
        finalResult: `🪙 ${face}!`, won: null,
      };
    },
  },
  {
    id: 'duelo-dados',
    name: 'Duelo de Dados',
    icon: Swords,
    description: 'Role um d20 contra o oponente. Maior valor vence.',
    dice: '1d20 vs 1d20',
    rules: [
      'Ambos rolam 1d20 simultaneamente.',
      'O maior resultado vence o round.',
      'Em caso de empate, ambos rolam novamente.',
      'Nat 20 = vantagem no próximo duelo.',
    ],
    play: () => {
      const p = roll(20), o = roll(20);
      const won = p.value > o.value, tie = p.value === o.value;
      let result = `Você: ${p.value} vs Oponente: ${o.value}`;
      result += tie ? ' — Empate!' : won ? ' — Vitória!' : ' — Derrota!';
      const logs: GameLog[] = [{
        round: 1, description: tie ? 'Empate!' : won ? 'Seu dado brilha mais alto!' : 'O oponente leva a melhor...',
        playerRolls: [p], opponentRolls: [o], success: won,
      }];
      if (p.value === 20) logs.push({ round: 2, description: '🌟 Nat 20! Vantagem no próximo duelo!', playerRolls: [], success: true });
      return { gameId: 'duelo-dados', gameName: 'Duelo de Dados', logs, finalResult: result, won: tie ? null : won };
    },
  },
  {
    id: 'par-impar',
    name: 'Par ou Ímpar',
    icon: Dices,
    description: 'Role 1d10 — par ou ímpar define o resultado.',
    dice: '1d10',
    rules: ['Declare Par ou Ímpar antes de rolar.', 'Role 1d10.', 'Se bater com sua aposta, você vence.', 'Variante: aposte moedas de ouro.'],
    play: () => {
      const r = roll(10);
      const isPar = r.value % 2 === 0;
      return {
        gameId: 'par-impar', gameName: 'Par ou Ímpar',
        logs: [{ round: 1, description: `O dado mostra ${r.value} — ${isPar ? 'Par' : 'Ímpar'}!`, playerRolls: [r] }],
        finalResult: `Resultado: ${r.value} — ${isPar ? 'Par!' : 'Ímpar!'}`, won: null,
      };
    },
  },
  {
    id: 'roleta',
    name: 'Roleta da Sorte',
    icon: Skull,
    description: 'Uma chance em seis... você tem coragem?',
    dice: '1d6',
    rules: ['Role 1d6. Se tirar 1, você perde.', 'Qualquer outro resultado = sobreviveu.', 'A cada rodada a aposta dobra.', 'Dica: CD 10 Sabedoria para não desistir.'],
    play: () => {
      const r = roll(6);
      const bang = r.value === 1;
      return {
        gameId: 'roleta', gameName: 'Roleta da Sorte',
        logs: [{ round: 1, description: bang ? '💀 BANG!' : `Click! Sobreviveu! (${r.value}/6)`, playerRolls: [r], success: !bang }],
        finalResult: bang ? '💀 BANG! Você perdeu!' : `🎉 Sobreviveu! (${r.value}/6)`, won: !bang,
      };
    },
  },
  {
    id: 'vinte-um',
    name: 'Vinte e Um',
    icon: Trophy,
    description: 'Chegue o mais perto de 21 sem estourar.',
    dice: '2d10+2',
    rules: ['Recebe 2 cartas (2d10, mín 2 cada).', 'Some os valores — objetivo: perto de 21.', 'Passou de 21 = estourou.', '21 exato = vitória épica!', 'Int CD 12 para contar cartas.'],
    play: () => {
      const cards = rollMultiple(10, 2).map(r => ({ ...r, value: r.value + 1 }));
      const total = sum(cards);
      const bust = total > 21, perfect = total === 21;
      let desc = `Cartas: ${cards.map(c => c.value).join(' + ')} = ${total}`;
      if (bust) desc += ' — 💥 Estourou!';
      else if (perfect) desc += ' — 🎯 Perfeito!';
      else desc += ` — Faltam ${21 - total}.`;
      return {
        gameId: 'vinte-um', gameName: 'Vinte e Um',
        logs: [{ round: 1, description: desc, playerRolls: cards, success: !bust }],
        finalResult: desc, won: bust ? false : perfect ? true : null, score: `${total}/21`,
      };
    },
  },
  {
    id: 'queda-braco',
    name: 'Queda de Braço',
    icon: Swords,
    description: 'Teste de Força! Melhor de 3 rounds.',
    dice: '3x d20 vs d20',
    rules: ['Melhor de 3. Ambos rolam 1d20 + Força.', 'Nat 20 = vitória automática.', 'Nat 1 = derrota automática.', 'Empate = rolam novamente.'],
    play: () => {
      let pw = 0, ow = 0;
      const logs: GameLog[] = [];
      for (let i = 0; i < 3; i++) {
        const p = roll(20), o = roll(20), won = p.value >= o.value;
        if (won) pw++; else ow++;
        let desc = `Você: ${p.value} vs Oponente: ${o.value}`;
        desc += p.value === 20 ? ' — Nat 20!' : p.value === 1 ? ' — Nat 1!' : won ? ' — Venceu!' : ' — Perdeu!';
        logs.push({ round: i + 1, description: desc, playerRolls: [p], opponentRolls: [o], success: won });
      }
      const won = pw > ow;
      return { gameId: 'queda-braco', gameName: 'Queda de Braço', logs, finalResult: `⚔️ ${pw} x ${ow} — ${won ? 'Vitória!' : 'Derrota!'}`, won, score: `${pw}x${ow}` };
    },
  },
  {
    id: 'maior-menor',
    name: 'Maior ou Menor',
    icon: Dices,
    description: 'O segundo dado será maior ou menor que o primeiro?',
    dice: '2d20',
    rules: ['Role 1d20 de referência.', 'Declare MAIOR ou MENOR.', 'Role o segundo d20.', 'Iguais = casa vence.', 'Sab CD 15 para intuição.'],
    play: () => {
      const first = roll(20), second = roll(20);
      const result = second.value > first.value ? 'MAIOR' : second.value < first.value ? 'MENOR' : 'IGUAL';
      return {
        gameId: 'maior-menor', gameName: 'Maior ou Menor',
        logs: [
          { round: 1, description: `Primeiro: ${first.value}`, playerRolls: [first] },
          { round: 2, description: `Segundo: ${second.value} — ${result}!`, playerRolls: [second], success: result !== 'IGUAL' },
        ],
        finalResult: `${first.value} → ${second.value} — ${result}!`, won: null,
      };
    },
  },
  {
    id: 'desafio-bebida',
    name: 'Desafio da Bebida',
    icon: Beer,
    description: 'Role contra CD crescente até cair!',
    dice: 'd20 vs CD',
    rules: ['CD inicial 8 (Constituição).', 'Passou = CD sobe +2.', 'Falhou = caiu.', '5+ rodadas = Lenda da Taverna!', 'Anões têm vantagem.'],
    play: () => {
      const logs: GameLog[] = [];
      let dc = 8, round = 1;
      while (true) {
        const r = roll(20), passed = r.value >= dc;
        logs.push({ round, description: passed ? `🍺 ${r.value} vs CD ${dc} — Aguentou!` : `🤢 ${r.value} vs CD ${dc} — Caiu!`, playerRolls: [r], success: passed });
        if (!passed) break;
        dc += 2; round++;
      }
      const survived = round - 1;
      return {
        gameId: 'desafio-bebida', gameName: 'Desafio da Bebida', logs,
        finalResult: `🍺 ${survived} rodada${survived !== 1 ? 's' : ''}! CD ${dc}${survived >= 5 ? ' — 🏆 LENDA!' : ''}`,
        won: survived >= 3, score: `${survived} rodadas`,
      };
    },
  },
  {
    id: 'dardos',
    name: 'Dardos',
    icon: Target,
    description: 'Três arremessos de d20. Mire no alvo!',
    dice: '3d20',
    rules: ['3 arremessos de 1d20 + Destreza.', 'Nat 20 = Bullseye (25 pts).', 'Nat 1 = 0 pts.', '40+ = Vitória. 50+ = Impressionante!'],
    play: () => {
      const throws = rollMultiple(20, 3);
      const points = throws.map(t => t.value === 20 ? 25 : t.value === 1 ? 0 : t.value);
      const total = points.reduce((a, b) => a + b, 0);
      const logs: GameLog[] = throws.map((t, i) => ({
        round: i + 1,
        description: t.value === 20 ? '🎯 Bullseye! 25 pts!' : t.value === 1 ? '💨 Errou! 0 pts.' : `${t.value} pts.`,
        playerRolls: [t], success: t.value >= 15,
      }));
      return {
        gameId: 'dardos', gameName: 'Dardos', logs,
        finalResult: `🎯 ${points.join('+')} = ${total}/65${total >= 50 ? ' — Impressionante!' : total >= 40 ? ' — Vitória!' : ''}`,
        won: total >= 40, score: `${total}/65`,
      };
    },
  },
  {
    id: 'dados-mentirosos',
    name: 'Dados Mentirosos',
    icon: Dices,
    description: 'Role 3d6 contra o oponente. Maior soma vence!',
    dice: '3d6 vs 3d6',
    rules: ['Ambos rolam 3d6 em segredo.', 'Maior soma real vence.', 'Enganação vs Intuição para blefar.', 'Tripla = valor dobrado!'],
    play: () => {
      const yourDice = rollMultiple(6, 3).sort((a, b) => a.value - b.value);
      const opDice = rollMultiple(6, 3).sort((a, b) => a.value - b.value);
      const isTriple = (d: RollResult[]) => d[0].value === d[1].value && d[1].value === d[2].value;
      const calc = (d: RollResult[]) => isTriple(d) ? sum(d) * 2 : sum(d);
      const ys = calc(yourDice), os = calc(opDice), won = ys >= os;
      return {
        gameId: 'dados-mentirosos', gameName: 'Dados Mentirosos',
        logs: [{ round: 1, description: `[${yourDice.map(d => d.value)}]${isTriple(yourDice) ? ' x2' : ''} = ${ys} vs [${opDice.map(d => d.value)}]${isTriple(opDice) ? ' x2' : ''} = ${os}`, playerRolls: yourDice, opponentRolls: opDice, success: won }],
        finalResult: `${ys} vs ${os} — ${won ? 'Vitória!' : 'Derrota!'}`, won, score: `${ys} vs ${os}`,
      };
    },
  },
  {
    id: 'bau-tesouro',
    name: 'Baú do Tesouro',
    icon: Trophy,
    description: 'Escolha o baú certo — 1 chance em 3!',
    dice: '2d3',
    rules: ['3 baús, 1 tesouro. Mestre rola 1d3 (posição).', 'Jogador rola 1d3 (escolha).', 'Coincidiu = tesouro!', 'Investigação CD 15 elimina 1 baú.', 'Recompensa: 2d6x10 GP.'],
    play: () => {
      const correct = roll(3), chosen = roll(3), won = correct.value === chosen.value;
      const reward = won ? rollMultiple(6, 2) : [], gold = won ? sum(reward) * 10 : 0;
      return {
        gameId: 'bau-tesouro', gameName: 'Baú do Tesouro',
        logs: [{ round: 1, description: won ? `Baú ${chosen.value} = 💰 ${gold} GP!` : `Baú ${chosen.value} vazio. Tesouro no ${correct.value}.`, playerRolls: [chosen, ...reward], success: won }],
        finalResult: won ? `💰 ${gold} GP!` : `💨 Vazio! Tesouro no baú ${correct.value}.`, won, score: won ? `${gold} GP` : '0 GP',
      };
    },
  },
  {
    id: 'briga-taverna',
    name: 'Briga na Taverna',
    icon: Swords,
    description: 'Uma boa e velha briga! Melhor de 5 rounds.',
    dice: '5x d20 vs d20',
    rules: ['Melhor de 5. Ambos rolam d20 + Força.', 'Nat 20 = crítico (conta 2x).', 'Nat 1 = tropeçou.', 'Perdedor paga as bebidas.'],
    play: () => {
      let pw = 0, ow = 0;
      const logs: GameLog[] = [];
      for (let i = 0; i < 5; i++) {
        const p = roll(20), o = roll(20);
        let pWins = p.value === 20 ? 2 : p.value === 1 ? -1 : p.value >= o.value ? 1 : 0;
        if (pWins > 0) pw += pWins; else ow++;
        let desc = `${p.value} vs ${o.value}`;
        desc += p.value === 20 ? ' — 💥 CRÍTICO!' : p.value === 1 ? ' — 🤦 Tropeçou!' : pWins > 0 ? ' — Acertou!' : ' — Levou!';
        logs.push({ round: i + 1, description: desc, playerRolls: [p], opponentRolls: [o], success: pWins > 0 });
      }
      const won = pw > ow;
      return { gameId: 'briga-taverna', gameName: 'Briga na Taverna', logs, finalResult: `⚔️ ${pw}x${ow} — ${won ? 'Vitória!' : 'Derrota!'}`, won, score: `${pw}x${ow}` };
    },
  },
];

// ── Custom game player ─────────────────────────────────

const playCustomGame = (def: CustomGameDef): GameState => {
  const logs: GameLog[] = [];
  let totalPlayer = 0, totalOpponent = 0;

  for (let i = 0; i < def.rounds; i++) {
    const pRolls = rollMultiple(def.diceType, def.diceCount);
    const pTotal = sum(pRolls);
    totalPlayer += pTotal;

    if (def.vsOpponent) {
      const oRolls = rollMultiple(def.diceType, def.diceCount);
      const oTotal = sum(oRolls);
      totalOpponent += oTotal;
      const won = pTotal >= oTotal;
      logs.push({
        round: i + 1,
        description: `Você: ${pTotal} vs Oponente: ${oTotal} — ${won ? 'Venceu!' : 'Perdeu!'}`,
        playerRolls: pRolls, opponentRolls: oRolls, success: won,
      });
    } else {
      const passed = pTotal >= def.targetScore;
      logs.push({
        round: i + 1,
        description: `Rolou ${pTotal} (alvo: ${def.targetScore}) — ${passed ? 'Passou!' : 'Falhou!'}`,
        playerRolls: pRolls, success: passed,
      });
    }
  }

  const won = def.vsOpponent ? totalPlayer > totalOpponent : totalPlayer >= def.targetScore * def.rounds;
  const score = def.vsOpponent ? `${totalPlayer} vs ${totalOpponent}` : `${totalPlayer}/${def.targetScore * def.rounds}`;

  return {
    gameId: def.id, gameName: def.name, logs,
    finalResult: `${won ? '🎉 Vitória!' : '💀 Derrota!'} — ${score}`,
    won, score,
  };
};

// ── Sub-components ─────────────────────────────────────

const RollBadge = ({ result }: { result: RollResult }) => (
  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
    <Badge variant="outline" className="font-mono text-xs gap-1">
      <span className={result.value === 20 ? 'text-primary font-bold' : result.value === 1 ? 'text-destructive font-bold' : ''}>
        {result.value}
      </span>
      <span className="text-muted-foreground">({result.die})</span>
    </Badge>
  </motion.span>
);

// ── Empty custom game ──────────────────────────────────

const emptyCustom = (): CustomGameDef => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  rules: [''],
  diceType: 20,
  diceCount: 1,
  rounds: 1,
  vsOpponent: false,
  targetScore: 10,
});

// ── Main component ─────────────────────────────────────

const TavernGames = () => {
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [expandedRules, setExpandedRules] = useState<string | null>(null);
  const [customGames, setCustomGames] = useLocalStorage<CustomGameDef[]>('arcanum-custom-tavern', []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomGameDef>(emptyCustom());

  const toggleRules = (id: string) => setExpandedRules(prev => prev === id ? null : id);

  const openNewGame = () => { setEditing(emptyCustom()); setDialogOpen(true); };
  const openEditGame = (def: CustomGameDef) => { setEditing({ ...def, rules: [...def.rules] }); setDialogOpen(true); };

  const saveCustom = () => {
    if (!editing.name.trim()) return;
    const clean = { ...editing, rules: editing.rules.filter(r => r.trim()) };
    if (clean.rules.length === 0) clean.rules = ['Sem regras definidas.'];
    setCustomGames(prev => {
      const exists = prev.find(g => g.id === clean.id);
      return exists ? prev.map(g => g.id === clean.id ? clean : g) : [...prev, clean];
    });
    setDialogOpen(false);
  };

  const deleteCustom = (id: string) => {
    setCustomGames(prev => prev.filter(g => g.id !== id));
    if (currentGame?.gameId === id) setCurrentGame(null);
  };

  // Merge built-in + custom
  const allGames: TavernGame[] = [
    ...builtInGames,
    ...customGames.map((def): TavernGame => ({
      id: def.id,
      name: def.name,
      icon: Sparkles,
      description: def.description || 'Jogo customizado',
      rules: def.rules,
      dice: `${def.diceCount}d${def.diceType}${def.vsOpponent ? ' vs oponente' : ''}`,
      play: () => playCustomGame(def),
      isCustom: true,
    })),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Jogos de Taverna</h1>
        <div className="flex gap-2">
          {currentGame && (
            <Button variant="outline" size="sm" onClick={() => setCurrentGame(null)}>
              <RotateCcw className="w-4 h-4 mr-2" />Limpar
            </Button>
          )}
          <Button size="sm" onClick={openNewGame}>
            <Plus className="w-4 h-4 mr-2" />Criar Jogo
          </Button>
        </div>
      </motion.div>

      {/* Result Panel */}
      <AnimatePresence mode="wait">
        {currentGame && (
          <motion.div key={currentGame.gameId + Date.now()} variants={resultPanel} initial="initial" animate="animate" exit="exit">
            <Card className={`glow-border ${currentGame.won === true ? 'border-primary/40' : currentGame.won === false ? 'border-destructive/40' : 'border-border'}`}>
              <CardContent className="p-5 space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">{currentGame.gameName}</p>
                    <p className="text-xl font-display font-bold mt-1">{currentGame.finalResult}</p>
                  </div>
                  {currentGame.score && (
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.3 }}>
                      <Badge variant="secondary" className="text-lg font-display px-3 py-1">{currentGame.score}</Badge>
                    </motion.div>
                  )}
                </motion.div>

                <div className="space-y-2 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Log de Rolagens</p>
                  {currentGame.logs.map((log, i) => (
                    <motion.div key={i} custom={i} variants={logItem} initial="initial" animate="animate"
                      className={`flex items-start gap-3 p-2.5 rounded-lg text-sm ${
                        log.success === true ? 'bg-primary/5' : log.success === false ? 'bg-destructive/5' : 'bg-secondary/30'
                      }`}
                    >
                      <span className="text-xs text-muted-foreground font-mono w-6 shrink-0 pt-0.5">R{log.round}</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p>{log.description}</p>
                        {log.playerRolls.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {log.playerRolls.map((r, j) => <RollBadge key={j} result={r} />)}
                            {log.opponentRolls && (
                              <>
                                <span className="text-muted-foreground text-xs self-center">vs</span>
                                {log.opponentRolls.map((r, j) => <RollBadge key={`o${j}`} result={r} />)}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allGames.map(game => {
          const isExpanded = expandedRules === game.id;
          const Icon = game.icon;

          return (
            <motion.div key={game.id} variants={cardItem} layout whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Card className="glass-card flex flex-col h-full border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-lg leading-tight">{game.name}</h3>
                        {game.isCustom && <Badge variant="secondary" className="text-[9px] px-1.5">Custom</Badge>}
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-0.5 font-mono">{game.dice}</Badge>
                    </div>
                    {game.isCustom && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditGame(customGames.find(c => c.id === game.id)!)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCustom(game.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{game.description}</p>

                  <button onClick={() => toggleRules(game.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>Regras do jogo</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div variants={rulesVariant} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
                        <ul className="text-xs text-muted-foreground space-y-1 mb-3 pl-1 border-l-2 border-primary/20 ml-1">
                          {game.rules.map((rule, i) => (
                            <motion.li key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="pl-2 leading-relaxed">
                              {rule}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button size="sm" onClick={() => setCurrentGame(game.play())} className="w-full">
                        <Dices className="w-4 h-4 mr-2" />Jogar
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {customGames.find(g => g.id === editing.id) ? 'Editar Jogo' : 'Criar Novo Jogo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do Jogo</label>
              <Input value={editing.name} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Corrida de Goblins" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Input value={editing.description} onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))} placeholder="Uma breve descrição do jogo" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo de Dado</label>
                <Select value={String(editing.diceType)} onValueChange={v => setEditing(prev => ({ ...prev, diceType: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[4, 6, 8, 10, 12, 20, 100].map(d => (
                      <SelectItem key={d} value={String(d)}>d{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantidade</label>
                <Input type="number" min={1} max={10} value={editing.diceCount} onChange={e => setEditing(prev => ({ ...prev, diceCount: Math.max(1, parseInt(e.target.value) || 1) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Rounds</label>
                <Input type="number" min={1} max={20} value={editing.rounds} onChange={e => setEditing(prev => ({ ...prev, rounds: Math.max(1, parseInt(e.target.value) || 1) }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Modo</label>
                <Select value={editing.vsOpponent ? 'vs' : 'solo'} onValueChange={v => setEditing(prev => ({ ...prev, vsOpponent: v === 'vs' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo (vs CD)</SelectItem>
                    <SelectItem value="vs">Vs Oponente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editing.vsOpponent && (
              <div>
                <label className="text-sm font-medium mb-1 block">CD / Alvo por Round</label>
                <Input type="number" min={1} value={editing.targetScore} onChange={e => setEditing(prev => ({ ...prev, targetScore: Math.max(1, parseInt(e.target.value) || 1) }))} />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Regras</label>
              <div className="space-y-2">
                {editing.rules.map((rule, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={rule}
                      onChange={e => {
                        const newRules = [...editing.rules];
                        newRules[i] = e.target.value;
                        setEditing(prev => ({ ...prev, rules: newRules }));
                      }}
                      placeholder={`Regra ${i + 1}`}
                    />
                    {editing.rules.length > 1 && (
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setEditing(prev => ({ ...prev, rules: prev.rules.filter((_, j) => j !== i) }))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditing(prev => ({ ...prev, rules: [...prev.rules, ''] }))}>
                  <Plus className="w-3 h-3 mr-1" />Regra
                </Button>
              </div>
            </div>

            <Button onClick={saveCustom} className="w-full" disabled={!editing.name.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />Salvar Jogo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TavernGames;
