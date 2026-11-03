import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, BookOpen, Dice5, HeartPulse, Shield, Sparkles, Swords } from 'lucide-react';
import { getActiveSystemId, getLiveSystem } from '@/lib/systemMode';
import { Card, CardContent } from '@/components/ui/card';

const toolLinks = ['/mesa?t=iniciativa', '/mesa?t=dados', '/notas', '/geradores?t=npc'];

export const SystemCockpit = () => {
  const [systemId, setSystemId] = useState(getActiveSystemId());
  const system = getLiveSystem(systemId);
  useEffect(() => {
    const sync = () => setSystemId(getActiveSystemId());
    window.addEventListener('arcanum-system-change', sync);
    return () => window.removeEventListener('arcanum-system-change', sync);
  }, []);
  const cards = [
    { label: system.mainResource, value: '—', icon: Sparkles },
    { label: system.secondaryResource, value: '—', icon: Activity },
    { label: system.defense, value: '—', icon: Shield },
    { label: system.health, value: '—', icon: HeartPulse },
  ];
  return (
    <Card className="surface-lift overflow-hidden" style={{ borderColor: `${system.accent}55` }}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${system.accent}, transparent)` }} />
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2"><span className="section-kicker">Sistema Vivo · Cockpit de sessão</span><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: system.accent, boxShadow: `0 0 12px ${system.accent}` }} /></div>
            <h2 className="font-display text-2xl md:text-3xl font-bold" style={{ color: system.accent }}>{system.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{system.lens}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-lg px-3 py-2" style={{ borderColor: `${system.accent}44`, background: system.surface }}><Dice5 className="w-4 h-4" style={{ color: system.accent }} />Motor: {system.dice}</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
          {cards.map(card => <div key={card.label} className="rounded-lg border border-border/40 bg-background/30 p-3"><card.icon className="w-4 h-4 mb-2" style={{ color: system.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{card.label}</p><p className="font-display text-xl font-bold mt-1">{card.value}</p></div>)}
        </div>
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border/40">
          {system.sceneTools.map((tool, index) => <Link key={tool} to={toolLinks[index]} className="group flex items-center gap-1.5 rounded-full border border-border/50 bg-background/25 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><BookOpen className="w-3 h-3" style={{ color: system.accent }} />{tool}<ArrowUpRight className="w-3 h-3 opacity-40 group-hover:opacity-100" /></Link>)}
        </div>
      </CardContent>
    </Card>
  );
};
