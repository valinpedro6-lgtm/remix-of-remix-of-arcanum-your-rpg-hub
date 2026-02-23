import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

interface GameResult {
  game: string;
  result: string;
  win?: boolean;
}

const TavernGames = () => {
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const d = (sides: number) => Math.floor(Math.random() * sides) + 1;

  const games = [
    {
      name: 'Cara ou Coroa',
      desc: 'Aposte em cara ou coroa',
      play: () => {
        const r = d(2);
        setLastResult({ game: 'Cara ou Coroa', result: r === 1 ? '🪙 Cara!' : '🪙 Coroa!' });
      },
    },
    {
      name: 'Duelo de Dados',
      desc: 'Role um D20 contra o oponente',
      play: () => {
        const p = d(20), o = d(20);
        const win = p > o;
        setLastResult({ game: 'Duelo de Dados', result: `Você: ${p} vs Oponente: ${o} — ${win ? 'Vitória!' : p === o ? 'Empate!' : 'Derrota!'}`, win });
      },
    },
    {
      name: 'Par ou Ímpar',
      desc: 'Adivinhe se o resultado é par ou ímpar',
      play: () => {
        const r = d(10);
        const isPar = r % 2 === 0;
        setLastResult({ game: 'Par ou Ímpar', result: `Resultado: ${r} — ${isPar ? 'Par!' : 'Ímpar!'}` });
      },
    },
    {
      name: 'Roleta Russa',
      desc: 'Uma chance em seis... coragem!',
      play: () => {
        const r = d(6);
        const bang = r === 1;
        setLastResult({ game: 'Roleta Russa', result: bang ? '💀 BANG! Você perdeu!' : `🎉 Click! Sobreviveu! (${r}/6)`, win: !bang });
      },
    },
    {
      name: 'Vinte e Um',
      desc: 'Tente chegar o mais perto de 21',
      play: () => {
        const cards = [d(10) + 1, d(10) + 1];
        const total = cards.reduce((a, b) => a + b, 0);
        const bust = total > 21;
        setLastResult({ game: 'Vinte e Um', result: `Cartas: ${cards.join(' + ')} = ${total} ${bust ? '💥 Estourou!' : total === 21 ? '🎯 Vinte e Um!' : ''}`, win: !bust });
      },
    },
    {
      name: 'Queda de Braço',
      desc: 'Teste de Força! Melhor de 3 rounds',
      play: () => {
        let pw = 0, ow = 0;
        const rounds: string[] = [];
        for (let i = 0; i < 3; i++) {
          const p = d(20), o = d(20);
          if (p >= o) pw++; else ow++;
          rounds.push(`R${i + 1}: ${p} vs ${o}`);
        }
        setLastResult({ game: 'Queda de Braço', result: `${rounds.join(' | ')} — ${pw > ow ? 'Vitória!' : 'Derrota!'}`, win: pw > ow });
      },
    },
    {
      name: 'Maior ou Menor',
      desc: 'Adivinhe se o próximo número é maior ou menor',
      play: () => {
        const first = d(20), second = d(20);
        setLastResult({ game: 'Maior ou Menor', result: `Primeiro: ${first} → Segundo: ${second} — O segundo foi ${second > first ? 'MAIOR!' : second < first ? 'MENOR!' : 'IGUAL!'}` });
      },
    },
    {
      name: 'Desafio da Bebida',
      desc: 'Role contra CD crescente!',
      play: () => {
        let survived = 0;
        let dc = 8;
        while (true) {
          const roll = d(20);
          if (roll < dc) break;
          survived++;
          dc += 2;
        }
        setLastResult({ game: 'Desafio da Bebida', result: `🍺 Aguentou ${survived} rodada${survived !== 1 ? 's' : ''}! CD final: ${dc}`, win: survived >= 3 });
      },
    },
    {
      name: 'Dardos',
      desc: 'Três arremessos, tente o alvo!',
      play: () => {
        const throws = [d(20), d(20), d(20)];
        const total = throws.reduce((a, b) => a + b, 0);
        setLastResult({ game: 'Dardos', result: `🎯 Arremessos: ${throws.join(', ')} = ${total}/60 pontos`, win: total >= 40 });
      },
    },
    {
      name: 'Dados Mentirosos',
      desc: 'Quem blefa melhor?',
      play: () => {
        const yourDice = [d(6), d(6), d(6)].sort();
        const opDice = [d(6), d(6), d(6)].sort();
        const yourTotal = yourDice.reduce((a, b) => a + b, 0);
        const opTotal = opDice.reduce((a, b) => a + b, 0);
        setLastResult({ game: 'Dados Mentirosos', result: `Seus dados: [${yourDice.join(',')}]=${yourTotal} vs Oponente: [${opDice.join(',')}]=${opTotal} — ${yourTotal >= opTotal ? 'Vitória!' : 'Derrota!'}`, win: yourTotal >= opTotal });
      },
    },
    {
      name: 'Baú do Tesouro',
      desc: 'Escolha o baú certo! 1 em 3',
      play: () => {
        const correct = d(3);
        const chosen = d(3);
        const won = correct === chosen;
        setLastResult({ game: 'Baú do Tesouro', result: `Você escolheu o baú ${chosen}, o tesouro estava no baú ${correct} — ${won ? '💰 Tesouro encontrado!' : '💨 Vazio!'}`, win: won });
      },
    },
    {
      name: 'Briga na Taverna',
      desc: 'Uma boa e velha briga! Melhor de 5',
      play: () => {
        let pw = 0, ow = 0;
        for (let i = 0; i < 5; i++) {
          const p = d(20), o = d(20);
          if (p >= o) pw++; else ow++;
        }
        setLastResult({ game: 'Briga na Taverna', result: `⚔️ ${pw} x ${ow} — ${pw > ow ? 'Você venceu a briga!' : 'Você foi derrotado!'}`, win: pw > ow });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Jogos de Taverna</h1>

      {lastResult && (
        <Card className={`card-hover border-2 ${lastResult.win === true ? 'border-primary/50' : lastResult.win === false ? 'border-accent/50' : 'border-border'}`}>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{lastResult.game}</p>
            <p className="text-xl font-display font-bold mt-1">{lastResult.result}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map(g => (
          <Card key={g.name} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold">{g.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{g.desc}</p>
              <Button size="sm" variant="outline" onClick={g.play} className="w-full">Jogar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TavernGames;
