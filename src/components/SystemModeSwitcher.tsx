import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, Radio } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getActiveSystemId, getLiveSystem, LIVE_SYSTEMS, setActiveSystemId } from '@/lib/systemMode';

export const SystemModeSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const [systemId, setSystemId] = useState(getActiveSystemId());
  const system = getLiveSystem(systemId);

  useEffect(() => {
    const sync = () => setSystemId(getActiveSystemId());
    window.addEventListener('arcanum-system-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('arcanum-system-change', sync); window.removeEventListener('storage', sync); };
  }, []);

  const change = (value: string) => { setSystemId(value); setActiveSystemId(value); };

  return (
    <div className={compact ? 'w-36' : 'space-y-2'}>
      {!compact && <p className="section-kicker px-1 flex items-center gap-1.5"><Radio className="w-3 h-3" />Sistema vivo</p>}
      <Select value={systemId} onValueChange={change}>
        <SelectTrigger className={compact ? 'h-8 text-xs border-primary/25 bg-primary/5' : 'h-10 w-full border-primary/25 bg-primary/[.04]'} style={{ boxShadow: `inset 3px 0 0 ${system.accent}` }}>
          <div className="flex items-center gap-2 min-w-0"><span className="grid place-items-center w-5 h-5 rounded text-[8px] font-black shrink-0" style={{ color: system.accent, background: `${system.accent}20` }}>{system.short.slice(0, 3)}</span><SelectValue /></div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {LIVE_SYSTEMS.map(item => <SelectItem key={item.id} value={item.id}><span className="flex items-center gap-2"><span className="w-7 text-[9px] font-black" style={{ color: item.accent }}>{item.short}</span><span>{item.name}</span></span></SelectItem>)}
        </SelectContent>
      </Select>
      {!compact && <p className="text-[10px] text-muted-foreground px-1 leading-tight">{system.tagline}. Os geradores e o painel seguem este sistema.</p>}
    </div>
  );
};
