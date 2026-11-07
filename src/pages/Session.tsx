import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import DiceRoller from '@/pages/DiceRoller';
import Initiative from '@/pages/Initiative';
import GameTimer from '@/pages/GameTimer';
import Tabletop from '@/pages/Tabletop';
import { Dices, Map, Play, Swords, Timer } from 'lucide-react';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'monster';
}

const Session = () => {
  const [combatants] = useLocalStorage<Combatant[]>('arcanum-initiative', []);
  const [round] = useLocalStorage<number>('arcanum-initiative-round', 1);
  const [timer] = useLocalStorage<{ isRunning: boolean }>('arcanum-timer', { isRunning: false });
  const sorted = useMemo(() => [...combatants].sort((a, b) => b.initiative - a.initiative), [combatants]);

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/30"><Play className="w-5 h-5 text-primary" /></span>
            <div>
              <h1 className="page-title">Modo Sessão</h1>
              <p className="text-sm text-muted-foreground mt-1">Tudo que o mestre precisa para conduzir a mesa.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant={timer.isRunning ? 'default' : 'secondary'} className="gap-1"><Timer className="w-3 h-3" />{timer.isRunning ? 'Timer ativo' : 'Timer pausado'}</Badge>
          <Badge variant="outline" className="gap-1"><Swords className="w-3 h-3" />Round {round}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Combatentes', value: combatants.length, icon: Swords },
          { label: 'Round atual', value: round, icon: Timer },
          { label: 'Dados', value: 'Pronto', icon: Dices },
          { label: 'Tabletop', value: 'Ao vivo', icon: Map },
        ].map(item => (
          <Card key={item.label} className="border-border/50 bg-card/60">
            <CardContent className="p-3 flex items-center gap-2">
              <item.icon className="w-4 h-4 text-primary" />
              <div className="min-w-0"><p className="font-display font-bold truncate">{item.value}</p><p className="text-[10px] text-muted-foreground truncate">{item.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sorted.length > 0 && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-[10px] uppercase tracking-widest text-primary shrink-0">Ordem rápida</span>
          {sorted.slice(0, 8).map((combatant, index) => <span key={combatant.id} className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${index === 0 ? 'bg-primary/20 text-primary' : 'bg-secondary/60 text-muted-foreground'}`}>{combatant.name} · {combatant.initiative}</span>)}
          <Link to="/mesa?t=iniciativa" className="text-[10px] text-primary hover:underline ml-auto shrink-0">Editar</Link>
        </div>
      )}

      <Tabs defaultValue="tabletop" className="w-full min-w-0">
        <div className="overflow-x-auto no-scrollbar">
          <TabsList className="w-max min-w-full justify-start bg-card/60 border border-border/50">
            <TabsTrigger value="tabletop" className="gap-2"><Map className="w-4 h-4" />Tabletop</TabsTrigger>
            <TabsTrigger value="initiative" className="gap-2"><Swords className="w-4 h-4" />Iniciativa</TabsTrigger>
            <TabsTrigger value="dice" className="gap-2"><Dices className="w-4 h-4" />Dados</TabsTrigger>
            <TabsTrigger value="timer" className="gap-2"><Timer className="w-4 h-4" />Timer</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="tabletop" className="mt-4"><Tabletop /></TabsContent>
        <TabsContent value="initiative" className="mt-4"><Initiative /></TabsContent>
        <TabsContent value="dice" className="mt-4"><DiceRoller /></TabsContent>
        <TabsContent value="timer" className="mt-4"><GameTimer /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Session;
