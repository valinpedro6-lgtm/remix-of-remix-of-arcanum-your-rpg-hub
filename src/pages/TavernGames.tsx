import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dices, Swords, Beer, Target, Trophy, Skull,
  ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';

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

const roll = (sides: number): RollResult => ({
  value: Math.floor(Math.random() * sides) + 1,
  die: `d${sides}`,
});

const rollMultiple = (sides: number, count: number): RollResult[] =>
  Array.from({ length: count }, () => roll(sides));

const sum = (rolls: RollResult[]) => rolls.reduce((a, r) => a + r.value, 0);

interface TavernGame {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  rules: string[];
  dice: string;
  play: () => GameState;
}

const games: TavernGame[] = [
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
        gameId: 'cara-coroa',
        gameName: 'Cara ou Coroa',
        logs: [{ round: 1, description: `A moeda girou e caiu em... ${face}!`, playerRolls: [r] }],
        finalResult: `🪙 ${face}!`,
        won: null,
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
      'Ambos os jogadores rolam 1d20 simultaneamente.',
      'O maior resultado vence o round.',
      'Em caso de empate, ambos rolam novamente.',
      'Bônus de Sorte: se tirar 20 natural, ganha vantagem no próximo duelo.',
    ],
    play: () => {
      const p = roll(20);
      const o = roll(20);
      const won = p.value > o.value;
      const tie = p.value === o.value;
      let result = `Você: ${p.value} vs Oponente: ${o.value}`;
      if (tie) result += ' — Empate!';
      else if (won) result += ' — Vitória!';
      else result += ' — Derrota!';

      const logs: GameLog[] = [{
        round: 1,
        description: tie ? 'Empate! Os dados mostram o mesmo valor.' : won ? 'Seu dado brilha mais alto!' : 'O oponente leva a melhor...',
        playerRolls: [p],
        opponentRolls: [o],
        success: won,
      }];

      if (p.value === 20) {
        logs.push({ round: 2, description: '🌟 Nat 20! Você ganha vantagem no próximo duelo!', playerRolls: [], success: true });
      }

      return { gameId: 'duelo-dados', gameName: 'Duelo de Dados', logs, finalResult: result, won: tie ? null : won };
    },
  },
  {
    id: 'par-impar',
    name: 'Par ou Ímpar',
    icon: Dices,
    description: 'Role 1d10 — par ou ímpar define o resultado.',
    dice: '1d10',
    rules: [
      'Declare se aposta em Par ou Ímpar antes da rolagem.',
      'Role 1d10.',
      'Se o resultado bater com sua aposta, você vence.',
      'Variante Taverna: aposte moedas de ouro antes de cada rodada.',
    ],
    play: () => {
      const r = roll(10);
      const isPar = r.value % 2 === 0;
      return {
        gameId: 'par-impar',
        gameName: 'Par ou Ímpar',
        logs: [{ round: 1, description: `O dado mostra ${r.value} — ${isPar ? 'Par' : 'Ímpar'}!`, playerRolls: [r] }],
        finalResult: `Resultado: ${r.value} — ${isPar ? 'Par!' : 'Ímpar!'}`,
        won: null,
      };
    },
  },
  {
    id: 'roleta',
    name: 'Roleta da Sorte',
    icon: Skull,
    description: 'Uma chance em seis... você tem coragem?',
    dice: '1d6',
    rules: [
      'Role 1d6. Se tirar 1, você perde.',
      'Qualquer outro resultado significa que sobreviveu.',
      'A cada rodada que sobreviver, a aposta dobra.',
      'Pode parar a qualquer momento e levar os ganhos.',
      'Dica para o Mestre: use como teste de coragem — CD 10 em Sabedoria para não desistir.',
    ],
    play: () => {
      const r = roll(6);
      const bang = r.value === 1;
      return {
        gameId: 'roleta',
        gameName: 'Roleta da Sorte',
        logs: [{
          round: 1,
          description: bang ? '💀 BANG! A sorte não estava do seu lado...' : `Click! Sobreviveu! (${r.value}/6)`,
          playerRolls: [r],
          success: !bang,
        }],
        finalResult: bang ? '💀 BANG! Você perdeu!' : `🎉 Click! Sobreviveu! (${r.value}/6)`,
        won: !bang,
      };
    },
  },
  {
    id: 'vinte-um',
    name: 'Vinte e Um',
    icon: Trophy,
    description: 'Chegue o mais perto de 21 sem estourar.',
    dice: '2d10+2 (cartas)',
    rules: [
      'Você recebe duas "cartas" (2d10, mínimo 2 cada).',
      'Some os valores. O objetivo é chegar o mais perto de 21.',
      'Se passar de 21, estourou e perde automaticamente.',
      'Acertar 21 exato é uma vitória épica!',
      'Variante RPG: teste de Inteligência CD 12 para "contar cartas" e ganhar +1 ou -1 no total.',
    ],
    play: () => {
      const cards = rollMultiple(10, 2).map(r => ({ ...r, value: r.value + 1 }));
      const total = sum(cards);
      const bust = total > 21;
      const perfect = total === 21;

      let desc = `Cartas: ${cards.map(c => c.value).join(' + ')} = ${total}`;
      if (bust) desc += ' — 💥 Estourou!';
      else if (perfect) desc += ' — 🎯 Vinte e Um perfeito!';
      else desc += ` — Faltam ${21 - total} para 21.`;

      return {
        gameId: 'vinte-um',
        gameName: 'Vinte e Um',
        logs: [{ round: 1, description: desc, playerRolls: cards, success: !bust }],
        finalResult: desc,
        won: bust ? false : perfect ? true : null,
        score: `${total}/21`,
      };
    },
  },
  {
    id: 'queda-braco',
    name: 'Queda de Braço',
    icon: Swords,
    description: 'Teste de Força! Melhor de 3 rounds de d20.',
    dice: '3x d20 vs d20',
    rules: [
      'Melhor de 3 rounds. Cada round, ambos rolam 1d20.',
      'Adicione o modificador de Força ao resultado.',
      'Quem vencer 2 rounds primeiro ganha.',
      'Nat 20 = vitória automática do round.',
      'Nat 1 = derrota automática do round.',
      'Em caso de empate no round, ambos rolam novamente.',
    ],
    play: () => {
      let pw = 0, ow = 0;
      const logs: GameLog[] = [];

      for (let i = 0; i < 3; i++) {
        const p = roll(20);
        const o = roll(20);
        const won = p.value >= o.value;
        if (won) pw++; else ow++;

        let desc = `Você: ${p.value} vs Oponente: ${o.value}`;
        if (p.value === 20) desc += ' — Nat 20! Vitória automática!';
        else if (p.value === 1) desc += ' — Nat 1! Derrota automática!';
        else desc += won ? ' — Você venceu!' : ' — Oponente venceu!';

        logs.push({ round: i + 1, description: desc, playerRolls: [p], opponentRolls: [o], success: won });
      }

      const won = pw > ow;
      return {
        gameId: 'queda-braco',
        gameName: 'Queda de Braço',
        logs,
        finalResult: `⚔️ ${pw} x ${ow} — ${won ? 'Você venceu!' : 'Você foi derrotado!'}`,
        won,
        score: `${pw} x ${ow}`,
      };
    },
  },
  {
    id: 'maior-menor',
    name: 'Maior ou Menor',
    icon: Dices,
    description: 'O segundo dado será maior ou menor que o primeiro?',
    dice: '2d20 (sequencial)',
    rules: [
      'Role o primeiro d20 — este é o valor de referência.',
      'Declare se o próximo será MAIOR ou MENOR.',
      'Role o segundo d20.',
      'Se acertar, ganha o dobro da aposta.',
      'Se os valores forem iguais, a casa vence.',
      'Variante: teste de Sabedoria CD 15 para "intuição" — saber se é maior ou menor antes de apostar.',
    ],
    play: () => {
      const first = roll(20);
      const second = roll(20);
      const result = second.value > first.value ? 'MAIOR' : second.value < first.value ? 'MENOR' : 'IGUAL';

      return {
        gameId: 'maior-menor',
        gameName: 'Maior ou Menor',
        logs: [
          { round: 1, description: `Primeiro dado: ${first.value}`, playerRolls: [first] },
          { round: 2, description: `Segundo dado: ${second.value} — ${result}!`, playerRolls: [second], success: result !== 'IGUAL' },
        ],
        finalResult: `Primeiro: ${first.value} → Segundo: ${second.value} — ${result}!`,
        won: null,
      };
    },
  },
  {
    id: 'desafio-bebida',
    name: 'Desafio da Bebida',
    icon: Beer,
    description: 'Role contra CD crescente até cair!',
    dice: 'd20 vs CD crescente',
    rules: [
      'Comece com CD 8 (teste de Constituição).',
      'Role 1d20 + mod. de Constituição.',
      'Se passar, beba outra rodada — a CD sobe em +2.',
      'Se falhar, você caiu. O jogo acaba.',
      'Sobreviver 5+ rodadas = lenda da taverna!',
      'Dica: anões têm vantagem neste teste (tradição!).',
    ],
    play: () => {
      const logs: GameLog[] = [];
      let dc = 8;
      let round = 1;

      while (true) {
        const r = roll(20);
        const passed = r.value >= dc;
        logs.push({
          round,
          description: passed
            ? `🍺 Rolou ${r.value} vs CD ${dc} — Aguentou! Mais uma rodada!`
            : `🤢 Rolou ${r.value} vs CD ${dc} — Caiu! Não aguentou mais.`,
          playerRolls: [r],
          success: passed,
        });
        if (!passed) break;
        dc += 2;
        round++;
      }

      const survived = round - 1;
      const legend = survived >= 5;

      return {
        gameId: 'desafio-bebida',
        gameName: 'Desafio da Bebida',
        logs,
        finalResult: `🍺 Aguentou ${survived} rodada${survived !== 1 ? 's' : ''}! CD final: ${dc}${legend ? ' — 🏆 LENDA DA TAVERNA!' : ''}`,
        won: survived >= 3,
        score: `${survived} rodadas`,
      };
    },
  },
  {
    id: 'dardos',
    name: 'Dardos',
    icon: Target,
    description: 'Três arremessos de d20. Mire no alvo!',
    dice: '3d20',
    rules: [
      'Faça 3 arremessos, cada um é 1d20.',
      'Adicione modificador de Destreza a cada arremesso.',
      'Nat 20 = Bullseye! Vale 25 pontos em vez de 20.',
      'Nat 1 = Errou feio. 0 pontos no arremesso.',
      'Total máximo: 65 pontos (com 3 bullseyes).',
      '40+ pontos = Vitória. 50+ = Impressionante!',
    ],
    play: () => {
      const throws = rollMultiple(20, 3);
      const points = throws.map(t => t.value === 20 ? 25 : t.value === 1 ? 0 : t.value);
      const total = points.reduce((a, b) => a + b, 0);

      const logs: GameLog[] = throws.map((t, i) => ({
        round: i + 1,
        description: t.value === 20
          ? `🎯 Bullseye! Nat 20 = 25 pontos!`
          : t.value === 1
          ? `💨 Errou feio! Nat 1 = 0 pontos.`
          : `Arremesso: ${t.value} pontos.`,
        playerRolls: [t],
        success: t.value >= 15,
      }));

      return {
        gameId: 'dardos',
        gameName: 'Dardos',
        logs,
        finalResult: `🎯 ${points.join(' + ')} = ${total}/65 pontos${total >= 50 ? ' — Impressionante!' : total >= 40 ? ' — Vitória!' : ''}`,
        won: total >= 40,
        score: `${total}/65`,
      };
    },
  },
  {
    id: 'dados-mentirosos',
    name: 'Dados Mentirosos',
    icon: Dices,
    description: 'Role 3d6 contra o oponente. Maior soma vence!',
    dice: '3d6 vs 3d6',
    rules: [
      'Ambos rolam 3d6 em segredo.',
      'Cada um declara (ou blefa sobre) seu total.',
      'Quem tiver a maior soma real vence.',
      'Variante RPG: teste de Enganação vs Intuição para blefar.',
      'Se ambos blefarem, teste resistido de Carisma.',
      'Tripla (3 dados iguais) = valor dobrado!',
    ],
    play: () => {
      const yourDice = rollMultiple(6, 3).sort((a, b) => a.value - b.value);
      const opDice = rollMultiple(6, 3).sort((a, b) => a.value - b.value);

      const isTriple = (dice: RollResult[]) => dice[0].value === dice[1].value && dice[1].value === dice[2].value;
      const calcScore = (dice: RollResult[]) => {
        const base = sum(dice);
        return isTriple(dice) ? base * 2 : base;
      };

      const yourScore = calcScore(yourDice);
      const opScore = calcScore(opDice);
      const won = yourScore >= opScore;

      const logs: GameLog[] = [{
        round: 1,
        description: `Seus dados: [${yourDice.map(d => d.value).join(', ')}]${isTriple(yourDice) ? ' TRIPLA! x2' : ''} = ${yourScore} vs Oponente: [${opDice.map(d => d.value).join(', ')}]${isTriple(opDice) ? ' TRIPLA! x2' : ''} = ${opScore}`,
        playerRolls: yourDice,
        opponentRolls: opDice,
        success: won,
      }];

      return {
        gameId: 'dados-mentirosos',
        gameName: 'Dados Mentirosos',
        logs,
        finalResult: `${yourScore} vs ${opScore} — ${won ? 'Vitória!' : 'Derrota!'}`,
        won,
        score: `${yourScore} vs ${opScore}`,
      };
    },
  },
  {
    id: 'bau-tesouro',
    name: 'Baú do Tesouro',
    icon: Trophy,
    description: 'Escolha o baú certo — 1 chance em 3!',
    dice: '2d3',
    rules: [
      'Há 3 baús. Apenas um contém o tesouro.',
      'O Mestre rola 1d3 em segredo (posição do tesouro).',
      'O jogador rola 1d3 (sua escolha).',
      'Se os valores coincidirem, encontrou o tesouro!',
      'Variante: teste de Investigação CD 15 para eliminar 1 baú antes de escolher.',
      'Recompensa sugerida: 2d6 x 10 peças de ouro.',
    ],
    play: () => {
      const correct = roll(3);
      const chosen = roll(3);
      const won = correct.value === chosen.value;

      const reward = won ? rollMultiple(6, 2) : [];
      const gold = won ? sum(reward) * 10 : 0;

      return {
        gameId: 'bau-tesouro',
        gameName: 'Baú do Tesouro',
        logs: [{
          round: 1,
          description: won
            ? `Você escolheu o baú ${chosen.value} e o tesouro estava no baú ${correct.value} — 💰 Tesouro encontrado! ${gold} peças de ouro!`
            : `Você escolheu o baú ${chosen.value}, mas o tesouro estava no baú ${correct.value} — 💨 Vazio!`,
          playerRolls: [chosen, ...reward],
          success: won,
        }],
        finalResult: won ? `💰 Tesouro no baú ${correct.value}! ${gold} peças de ouro!` : `💨 Vazio! O tesouro estava no baú ${correct.value}.`,
        won,
        score: won ? `${gold} GP` : '0 GP',
      };
    },
  },
  {
    id: 'briga-taverna',
    name: 'Briga na Taverna',
    icon: Swords,
    description: 'Uma boa e velha briga! Melhor de 5 rounds.',
    dice: '5x d20 vs d20',
    rules: [
      'Melhor de 5 rounds de combate desarmado.',
      'Cada round: ambos rolam 1d20 + mod. de Força.',
      'Nat 20 = golpe crítico! Conta como 2 vitórias.',
      'Nat 1 = tropeçou. Perde o round automaticamente.',
      'Quem vencer 3 rounds primeiro ganha a briga.',
      'O perdedor paga a rodada de bebidas da taverna.',
    ],
    play: () => {
      let pw = 0, ow = 0;
      const logs: GameLog[] = [];

      for (let i = 0; i < 5; i++) {
        const p = roll(20);
        const o = roll(20);

        let pWins = 0;
        if (p.value === 20) pWins = 2;
        else if (p.value === 1) pWins = -1;
        else if (p.value >= o.value) pWins = 1;

        if (pWins > 0) pw += pWins;
        else ow++;

        let desc = `Você: ${p.value} vs Oponente: ${o.value}`;
        if (p.value === 20) desc += ' — 💥 CRÍTICO! Conta 2x!';
        else if (p.value === 1) desc += ' — 🤦 Tropeçou!';
        else if (o.value === 20) desc += ' — 💥 Oponente acertou um crítico!';
        else desc += p.value >= o.value ? ' — Acertou!' : ' — Levou um soco!';

        logs.push({ round: i + 1, description: desc, playerRolls: [p], opponentRolls: [o], success: pWins > 0 });
      }

      const won = pw > ow;
      return {
        gameId: 'briga-taverna',
        gameName: 'Briga na Taverna',
        logs,
        finalResult: `⚔️ ${pw} x ${ow} — ${won ? 'Você venceu a briga!' : 'Você foi derrotado!'}`,
        won,
        score: `${pw} x ${ow}`,
      };
    },
  },
];

const RollBadge = ({ result }: { result: RollResult }) => (
  <Badge variant="outline" className="font-mono text-xs gap-1">
    <span className={result.value === 20 ? 'text-primary font-bold' : result.value === 1 ? 'text-destructive font-bold' : ''}>
      {result.value}
    </span>
    <span className="text-muted-foreground">({result.die})</span>
  </Badge>
);

const TavernGames = () => {
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [expandedRules, setExpandedRules] = useState<string | null>(null);

  const playGame = (game: TavernGame) => {
    setCurrentGame(game.play());
  };

  const toggleRules = (id: string) => {
    setExpandedRules(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Jogos de Taverna</h1>
        {currentGame && (
          <Button variant="outline" size="sm" onClick={() => setCurrentGame(null)}>
            <RotateCcw className="w-4 h-4 mr-2" />Limpar
          </Button>
        )}
      </div>

      {/* Result Panel */}
      {currentGame && (
        <Card className={`glow-border ${currentGame.won === true ? 'border-primary/40' : currentGame.won === false ? 'border-destructive/40' : 'border-border'}`}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{currentGame.gameName}</p>
                <p className="text-xl font-display font-bold mt-1">{currentGame.finalResult}</p>
              </div>
              {currentGame.score && (
                <Badge variant="secondary" className="text-lg font-display px-3 py-1">{currentGame.score}</Badge>
              )}
            </div>

            {/* Game Log */}
            <div className="space-y-2 border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Log de Rolagens</p>
              {currentGame.logs.map((log, i) => (
                <div
                  key={i}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => {
          const isExpanded = expandedRules === game.id;
          const Icon = game.icon;

          return (
            <Card key={game.id} className="card-hover glass-card flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg leading-tight">{game.name}</h3>
                    <Badge variant="outline" className="text-[10px] mt-0.5 font-mono">{game.dice}</Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{game.description}</p>

                {/* Rules accordion */}
                <button
                  onClick={() => toggleRules(game.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>Regras do jogo</span>
                </button>

                {isExpanded && (
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3 pl-1 border-l-2 border-primary/20 ml-1">
                    {game.rules.map((rule, i) => (
                      <li key={i} className="pl-2 leading-relaxed">{rule}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto">
                  <Button size="sm" onClick={() => playGame(game)} className="w-full">
                    <Dices className="w-4 h-4 mr-2" />Jogar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TavernGames;
