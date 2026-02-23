import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronRight, RotateCcw } from 'lucide-react';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
}

const Initiative = () => {
  const [combatants, setCombatants] = useLocalStorage<Combatant[]>('arcanum-initiative', []);
  const [currentTurn, setCurrentTurn] = useLocalStorage<number>('arcanum-initiative-turn', 0);
  const [name, setName] = useState('');
  const [init, setInit] = useState('');

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const add = () => {
    if (!name.trim()) return;
    setCombatants(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), initiative: parseInt(init) || 0 }]);
    setName('');
    setInit('');
  };

  const remove = (id: string) => setCombatants(prev => prev.filter(c => c.id !== id));
  const nextTurn = () => setCurrentTurn(prev => (prev + 1) % sorted.length);
  const resetCombat = () => { setCombatants([]); setCurrentTurn(0); };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Iniciativa</h1>
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="flex-1" />
              <Input placeholder="Iniciativa" type="number" value={init} onChange={e => setInit(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="w-24" />
              <Button onClick={add} size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {sorted.length > 0 && (
          <div className="flex gap-2 mb-2">
            <Button onClick={nextTurn} className="flex-1" size="lg">
              <ChevronRight className="w-4 h-4 mr-2" />Próximo Turno
            </Button>
            <Button onClick={resetCombat} variant="outline" size="lg">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((c, i) => (
            <Card key={c.id} className={`card-hover transition-all ${i === currentTurn % sorted.length ? 'border-primary/50 bg-primary/5' : ''}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {i === currentTurn % sorted.length && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  <span className="font-semibold text-lg">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display font-bold text-primary">{c.initiative}</span>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Initiative;
