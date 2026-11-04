import { SheetAttribute } from '@/lib/sheets';
import { Minus, Plus } from 'lucide-react';

interface Props {
  attributes: SheetAttribute[];
  onChange?: (id: string, value: number) => void;
  className?: string;
}

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

/** Roda de atributos no estilo Ordem Paranormal: hexágonos ao redor de um núcleo. */
export const AttributeWheel = ({ attributes, onChange, className }: Props) => {
  const n = Math.max(attributes.length, 1);
  const radius = n <= 3 ? 32 : n <= 6 ? 36 : 39;
  const hexSize = n <= 5 ? 30 : n <= 8 ? 25 : 21;

  return (
    <div className={`relative aspect-square w-full max-w-[380px] mx-auto select-none ${className || ''}`}>
      {/* aura */}
      <div
        className="absolute inset-[8%] rounded-full blur-2xl opacity-40"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.55), transparent 70%)' }}
      />
      {/* anel */}
      <div className="absolute inset-[14%] rounded-full border border-primary/30" />
      <div className="absolute inset-[22%] rounded-full border border-primary/15" />

      {/* núcleo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="font-display font-black text-primary text-[clamp(0.6rem,2.6vw,0.95rem)] tracking-widest drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]">
          ATRIBUTOS
        </p>
      </div>

      {attributes.map((a, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        return (
          <div
            key={a.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${left}%`, top: `${top}%`, width: `${hexSize}%` }}
          >
            <div className="relative aspect-square">
              <div
                className="absolute inset-0 bg-primary/90 shadow-[0_0_18px_hsl(var(--primary)/0.55)]"
                style={{ clipPath: HEX }}
              />
              <div
                className="absolute inset-[7%] bg-black flex flex-col items-center justify-center"
                style={{ clipPath: HEX }}
              >
                <span className="font-display font-black leading-none text-[clamp(0.9rem,4.5vw,1.6rem)] text-primary-foreground text-white">
                  {a.value}
                </span>
                <span className="font-display font-bold leading-none text-primary text-[clamp(0.45rem,1.7vw,0.65rem)] tracking-wider mt-0.5">
                  {a.short}
                </span>
              </div>
            </div>
            {onChange && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label={`Diminuir ${a.label}`}
                  onClick={() => onChange(a.id, a.value - 1)}
                  className="w-5 h-5 rounded-full bg-card border border-border/60 flex items-center justify-center hover:border-primary"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Aumentar ${a.label}`}
                  onClick={() => onChange(a.id, a.value + 1)}
                  className="w-5 h-5 rounded-full bg-card border border-border/60 flex items-center justify-center hover:border-primary"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
