import { useState } from 'react';
import { Dices, Shield, Zap } from 'lucide-react';
import { Sheet, SheetAttribute, SheetRoll, SheetSkill } from '@/lib/sheets';
import { derivedStats, rollAttribute, rollDerived, rollSkill } from '@/lib/sheetAutomation';
import { DiceAnimation, Roll } from '@/components/DiceBar';

interface Props {
  sheet: Sheet;
  onRoll?: (roll: SheetRoll) => void;
}

export const SheetAutomation = ({ sheet, onRoll }: Props) => {
  const [roll, setRoll] = useState<Roll | null>(null);
  const stats = derivedStats(sheet);
  const trained = sheet.skills.filter(skill => skill.trained || skill.value > 0).slice(0, 12);

  const emit = (next: Roll) => {
    setRoll(next);
    onRoll?.(next);
  };

  const attr = (attribute: SheetAttribute) => emit(rollAttribute(sheet, attribute));
  const skill = (entry: SheetSkill) => emit(rollSkill(sheet, entry));
  const derived = (label: 'iniciativa' | 'percepção') => emit(rollDerived(sheet, label));

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Dices className="w-4 h-4 text-primary" />
        <div>
          <p className="text-xs font-display font-bold uppercase tracking-widest text-primary">Automação da ficha</p>
          <p className="text-[11px] text-muted-foreground">Clique para rolar sem fazer a matemática à mão.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <button type="button" onClick={() => derived('iniciativa')} className="rounded-md border border-border/60 bg-background/60 px-2 py-2 text-left hover:border-primary">
          <span className="block text-muted-foreground">Iniciativa</span><strong>+{stats.initiative}</strong>
        </button>
        <button type="button" onClick={() => derived('percepção')} className="rounded-md border border-border/60 bg-background/60 px-2 py-2 text-left hover:border-primary">
          <span className="block text-muted-foreground">Percepção</span><strong>+{stats.perception}</strong>
        </button>
        <div className="rounded-md border border-border/60 bg-background/40 px-2 py-2"><span className="block text-muted-foreground"><Shield className="inline w-3 h-3 mr-1" />Defesa</span><strong>{stats.defense}</strong></div>
        <div className="rounded-md border border-border/60 bg-background/40 px-2 py-2"><span className="block text-muted-foreground"><Zap className="inline w-3 h-3 mr-1" />Carga</span><strong>{stats.load}</strong></div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {sheet.attributes.map(attribute => <button key={attribute.id} type="button" onClick={() => attr(attribute)} className="rounded-full border border-primary/30 bg-background/60 px-2 py-1 text-[11px] hover:border-primary">{attribute.short} {attribute.value}</button>)}
      </div>
      {trained.length > 0 && <div className="flex flex-wrap gap-1.5">{trained.map(entry => <button key={entry.id} type="button" onClick={() => skill(entry)} className="rounded-full border border-border/60 bg-background/60 px-2 py-1 text-[11px] hover:border-primary">{entry.name} {entry.trained ? `+${Math.max(5, entry.value)}` : `+${entry.value}`}</button>)}</div>}
      {sheet.last_roll && <p className="text-xs text-muted-foreground">Última rolagem: <strong className="text-foreground">{sheet.last_roll.total}</strong> · {sheet.last_roll.detail ?? sheet.last_roll.expr}</p>}
      <DiceAnimation roll={roll} />
    </div>
  );
};
