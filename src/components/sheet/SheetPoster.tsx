import { Sheet, SheetResource } from '@/lib/sheets';
import { AttributeWheel } from './AttributeWheel';
import { Minus, Plus, UserRound } from 'lucide-react';
import { getSystem, SheetFrame } from '@/lib/sheetSystems';

/** Visual de cada sistema: moldura, caixas e efeitos. */
const FRAMES: Record<SheetFrame, { wrap: string; box: string; tag: string; bg?: React.CSSProperties; fx?: React.CSSProperties; rounded: string }> = {
  paranormal: { wrap: 'border border-primary/25 rounded-2xl', box: 'bg-black/70 border border-primary/20 rounded-lg', tag: 'Ordem', rounded: 'rounded-2xl' },
  parchment: {
    wrap: 'border-4 border-double border-primary/50 rounded-md', box: 'bg-[hsl(30_25%_10%/0.85)] border border-primary/40 rounded-sm shadow-[inset_0_0_12px_hsl(var(--primary)/0.15)]', tag: 'Grimório', rounded: 'rounded-md',
    bg: { background: 'radial-gradient(120% 80% at 30% 20%, hsl(32 35% 16%), hsl(25 30% 6%))' },
    fx: { backgroundImage: 'repeating-linear-gradient(45deg, hsl(40 40% 60% / 0.035) 0 2px, transparent 2px 6px)' },
  },
  gothic: {
    wrap: 'border-2 border-primary/50 rounded-t-[2.5rem] rounded-b-md', box: 'bg-black/75 border-y border-primary/40 rounded-none', tag: 'Linhagem', rounded: 'rounded-t-[2.5rem] rounded-b-md',
    bg: { background: 'radial-gradient(90% 70% at 50% 0%, hsl(var(--primary)/0.35), black 70%)' },
  },
  neon: {
    wrap: 'border border-primary/60 rounded-none [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,24px_100%,0_calc(100%-24px))]', box: 'bg-black/80 border border-primary/50 rounded-none [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]', tag: 'NET//ID', rounded: '',
    fx: { backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--primary)/0.06) 0 1px, transparent 1px 3px)' },
  },
  horror: {
    wrap: 'border border-primary/30 rounded-sm', box: 'bg-[hsl(60_10%_6%/0.85)] border border-dashed border-primary/40 rounded-sm', tag: 'Dossiê', rounded: 'rounded-sm',
    bg: { background: 'radial-gradient(100% 80% at 20% 10%, hsl(80 15% 12%), hsl(0 0% 3%))' },
    fx: { backgroundImage: 'radial-gradient(hsl(0 0% 100% / 0.04) 1px, transparent 1px)', backgroundSize: '4px 4px' },
  },
  punk: {
    wrap: 'border-4 border-primary rounded-none', box: 'bg-black border-2 border-primary rounded-none -skew-x-2', tag: 'MALDITO', rounded: '',
  },
  heroic: {
    wrap: 'border-2 border-primary/50 rounded-xl', box: 'bg-black/70 border border-primary/30 rounded-lg shadow-[0_0_14px_hsl(var(--primary)/0.15)]', tag: 'Herói', rounded: 'rounded-xl',
    fx: { background: 'linear-gradient(180deg, hsl(var(--primary)/0.18), transparent 30%)' },
  },
};

interface Props {
  sheet: Sheet;
  editable?: boolean;
  onPatch?: (patch: Partial<Sheet>) => void;
  onReorderAttributes?: (fromId: string, toId: string) => void;
  compact?: boolean;
}

const toneClass: Record<SheetResource['tone'], string> = {
  life: 'from-primary to-[hsl(var(--ember))]',
  sanity: 'from-[hsl(210_90%_55%)] to-[hsl(200_95%_45%)]',
  effort: 'from-[hsl(var(--gold))] to-[hsl(38_90%_45%)]',
  neutral: 'from-muted-foreground to-muted',
};

/** Ficha em formato "pôster": arte do personagem ao fundo, roda de atributos e perícias. */
export const SheetPoster = ({ sheet, editable, onPatch, onReorderAttributes, compact }: Props) => {
  const patchResource = (id: string, delta: number) => {
    if (!onPatch) return;
    onPatch({
      resources: sheet.resources.map(r =>
        r.id === id ? { ...r, current: Math.max(0, Math.min(r.max, r.current + delta)) } : r
      ),
    });
  };

  const patchAttribute = (id: string, value: number) => {
    if (!onPatch) return;
    onPatch({
      attributes: sheet.attributes.map(a => (a.id === id ? { ...a, value: Math.max(0, value) } : a)),
    });
  };

  const trained = sheet.skills.filter(s => s.trained || s.value > 0);
  const st = sheet.style ?? {};
  const sys = getSystem(st.system);
  const fr = FRAMES[sys.frame];
  const blockOrder = st.blockOrder ?? ['abilities', 'skills', 'inventory', 'notes'];
  const blockIndex = (id: string) => blockOrder.indexOf(id) < 0 ? blockOrder.length : blockOrder.indexOf(id);
  const fontClass = { display: 'font-display', serif: 'font-serif', sans: 'font-sans', mono: 'font-mono' }[st.font ?? sys.font];
  const layout = st.layout ?? 'right';
  const imgPos = layout === 'full' ? 'inset-0 w-full' : layout === 'left' ? 'left-0 top-0 w-full sm:w-[58%]' : 'right-0 top-0 w-full sm:w-[58%]';
  const overlay = (st.overlay ?? 50) / 100;
  const vars = { '--primary': st.color ?? sys.color, ...(fr.bg ?? {}) } as React.CSSProperties;

  return (
    <div style={vars} className={`relative w-full overflow-hidden bg-black shadow-[0_0_40px_hsl(var(--primary)/0.15)] ${fr.wrap}`}>
      {fr.fx && <div className="absolute inset-0 pointer-events-none z-0" style={fr.fx} />}
      {/* Arte de fundo */}
      {sheet.image_url ? (
        <img
          src={sheet.image_url}
          alt={sheet.name}
          className={`absolute h-full ${imgPos} object-cover object-top opacity-70 sm:opacity-95 pointer-events-none`}
        />
      ) : (
        <div className="absolute right-0 top-0 h-full w-full sm:w-[45%] flex items-center justify-center opacity-20">
          <UserRound className="w-24 h-24 text-primary" />
        </div>
      )}
      <div className={`absolute inset-0 ${layout === 'left' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black via-black/90 sm:via-black/75 to-black/40`} style={{ opacity: 0.4 + overlay * 0.6 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(60% 50% at 20% 40%, hsl(var(--primary)/0.25), transparent 70%)' }}
      />

      <div className={`relative z-10 ${compact ? 'p-4' : 'p-5 md:p-8'}`}>
        {/* Cabeçalho */}
        <div className={layout === 'left' ? 'max-w-[60%] sm:max-w-[55%] ml-auto text-right' : 'max-w-[60%] sm:max-w-[55%]'}>
          <p className={`${fontClass} text-[10px] tracking-[0.3em] uppercase text-primary/70 mb-1`}>{fr.tag} · {sys.name}</p>
          <h2
            className={`${fontClass} font-black ${st.uppercase === false ? '' : 'uppercase'} tracking-tight text-primary leading-none ${
              compact ? 'text-2xl' : 'text-4xl md:text-6xl'
            }`}
            style={{ textShadow: '0 0 18px hsl(var(--primary)/0.75), 0 0 42px hsl(var(--primary)/0.4)' }}
          >
            {sheet.name}
          </h2>
          {sheet.subtitle && (
            <p className={`mt-2 text-white/90 italic ${compact ? 'text-xs' : 'text-sm md:text-lg'}`}>
              {sheet.subtitle}
            </p>
          )}
          {sheet.origin && (
            <p className="mt-1 text-primary/80 text-xs md:text-sm font-semibold uppercase tracking-widest">
              {sheet.origin}
            </p>
          )}
        </div>

        <div className={`mt-5 grid gap-5 ${compact ? '' : 'md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]'}`}>
          {/* Roda + recursos */}
          <div className="space-y-4">
            <AttributeWheel
              attributes={sheet.attributes}
              onChange={editable ? patchAttribute : undefined}
              onReorder={editable ? onReorderAttributes : undefined}
            />

            <div className="space-y-2">
              {sheet.resources.map(r => {
                const pct = r.max > 0 ? Math.round((r.current / r.max) * 100) : 0;
                return (
                  <div key={r.id} className={` px-3 py-2 backdrop-blur-sm ${fr.box}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display font-bold text-[11px] tracking-widest uppercase text-white/80">
                        {r.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {editable && (
                          <button
                            type="button"
                            aria-label={`Diminuir ${r.label}`}
                            onClick={() => patchResource(r.id, -1)}
                            className="w-6 h-6 rounded-md bg-white/5 border border-white/15 flex items-center justify-center hover:border-primary text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        <span className="font-display font-black text-sm text-white tabular-nums">
                          {r.current}<span className="text-white/40">/{r.max}</span>
                        </span>
                        {editable && (
                          <button
                            type="button"
                            aria-label={`Aumentar ${r.label}`}
                            onClick={() => patchResource(r.id, 1)}
                            className="w-6 h-6 rounded-md bg-white/5 border border-white/15 flex items-center justify-center hover:border-primary text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${toneClass[r.tone]} transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habilidades + perícias */}
          <div className="flex flex-col gap-4">
            {sheet.abilities.length > 0 && (
              <div className="space-y-2" style={{ order: blockIndex('abilities') }}>
                {sheet.abilities.map(ab => (
                  <div key={ab.id} className="bg-black/70 backdrop-blur-sm border-l-2 border-primary rounded-r-md overflow-hidden">
                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-white/10 to-transparent px-3 py-1.5">
                      <span className="font-display font-bold uppercase text-white text-sm tracking-wide">{ab.name}</span>
                      {ab.cost && (
                        <span className="font-display font-black text-primary text-sm whitespace-nowrap">{ab.cost}</span>
                      )}
                    </div>
                    {ab.description && (
                      <p className="px-3 py-1.5 text-xs text-white/75 leading-snug">{ab.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {trained.length > 0 && (
              <div className={`backdrop-blur-sm p-3 ${fr.box}`} style={{ order: blockIndex('skills') }}>
                <p className="font-display font-bold text-primary text-[11px] tracking-widest uppercase mb-2">{sys.id === 'cthulhu' ? 'Perícias (%)' : 'Perícias'}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
                  {trained.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs border-b border-white/5 py-0.5">
                      <span className={s.trained ? 'text-white font-semibold' : 'text-white/60'}>{s.name}</span>
                      <span className="font-display font-bold text-primary tabular-nums">
                        {s.value >= 0 ? `+${s.value}` : s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(sheet.style?.inventory?.length ?? 0) > 0 && (
              <div className={`backdrop-blur-sm p-3 ${fr.box}`} style={{ order: blockIndex('inventory') }}>
                <p className="font-display font-bold text-primary text-[11px] tracking-widest uppercase mb-2">Inventário</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                  {sheet.style!.inventory!.map(it => (
                    <div key={it.id} className="flex items-center justify-between gap-2 text-xs border-b border-white/5 py-0.5">
                      <span className="text-white truncate">{it.name}{it.note ? <span className="text-white/50"> · {it.note}</span> : null}</span>
                      <span className="font-display font-bold text-primary tabular-nums">x{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sheet.notes && (
              <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-3" style={{ order: blockIndex('notes') }}>
                <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">{sheet.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
