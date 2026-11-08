import { Heart, Shield, Sparkles, UserRound } from 'lucide-react';
import { Sheet } from '@/lib/sheets';
import { getSystem } from '@/lib/sheetSystems';

interface Props {
  sheet: Sheet;
}

const resourceTone: Record<string, string> = {
  life: 'from-red-500 to-orange-400',
  sanity: 'from-sky-400 to-blue-500',
  effort: 'from-amber-300 to-yellow-500',
  neutral: 'from-zinc-400 to-zinc-600',
};

/** Visual público da ficha: composição editorial/ilustrada, sem aparência de formulário. */
export const PlayerSheetCard = ({ sheet }: Props) => {
  const system = getSystem(sheet.style?.system);
  const trained = sheet.skills.filter(skill => skill.trained || skill.value > 0);
  const image = sheet.image_url;

  return (
    <article
      className="relative mx-auto min-h-[520px] w-full max-w-6xl overflow-hidden border border-white/15 bg-[#111113] text-white shadow-[0_25px_90px_-35px_hsl(var(--primary)/.8)] sm:min-h-[580px] md:aspect-[1.72] md:min-h-0"
      style={{ '--sheet-accent': sheet.style?.color ? `hsl(${sheet.style.color})` : `hsl(${system.color})` } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,.09),transparent_28%),linear-gradient(125deg,#171719,#080809)]" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 12px, rgba(255,255,255,.035) 13px 14px)' }} />

      {image ? (
        <img src={image} alt="" className="absolute inset-y-0 right-0 h-full w-[59%] object-cover object-top opacity-90" />
      ) : (
        <div className="absolute inset-y-0 right-0 flex h-full w-[59%] items-center justify-center opacity-20">
          <UserRound className="h-40 w-40" style={{ color: 'var(--sheet-accent)' }} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080809] via-[#080809]/88 via-48% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

      <div className="relative z-10 grid min-h-[520px] grid-cols-[.9fr_1.1fr] gap-3 p-4 sm:min-h-[580px] sm:gap-6 sm:p-7 md:min-h-0 md:gap-8 md:p-10">
        <section className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-poster text-[11px] uppercase tracking-[.28em]" style={{ color: 'var(--sheet-accent)' }}>{system.name}</p>
              <h1 className="mt-2 max-w-[18rem] font-elegant text-3xl font-bold uppercase leading-[.78] tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,.8)] sm:text-5xl md:text-7xl">{sheet.name}</h1>
              {sheet.subtitle && <p className="mt-2 max-w-sm font-elegant text-xs italic leading-tight text-white/80 sm:text-base">{sheet.subtitle}</p>}
              {sheet.origin && <p className="mt-1 font-poster text-[9px] uppercase tracking-[.2em] sm:text-xs" style={{ color: 'var(--sheet-accent)' }}>{sheet.origin}</p>}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-black/60 p-1 shadow-[0_0_24px_var(--sheet-accent)] sm:h-16 sm:w-16">
              {image ? <img src={image} alt="" className="h-full w-full rounded-full object-cover object-top" /> : <Sparkles className="h-7 w-7" style={{ color: 'var(--sheet-accent)' }} />}
            </div>
          </div>

          <div className="mt-4 grid max-w-md grid-cols-2 gap-x-2 gap-y-1 sm:mt-7 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-1.5">
            {sheet.attributes.map(attribute => (
              <div key={attribute.id} className="flex items-center justify-between border-b border-white/20 bg-black/25 px-1.5 py-0.5 font-poster text-[9px] uppercase tracking-wider backdrop-blur-sm sm:px-2 sm:py-1 sm:text-xs">
                <span className="truncate text-white/85">{attribute.short || attribute.label}</span>
                <b className="ml-1 text-sm sm:text-base" style={{ color: 'var(--sheet-accent)' }}>{attribute.value}</b>
              </div>
            ))}
          </div>

          <div className="mt-3 max-w-md space-y-1 sm:mt-5 sm:space-y-2">
            {sheet.resources.map(resource => {
              const percentage = resource.max > 0 ? Math.max(0, Math.min(100, (resource.current / resource.max) * 100)) : 0;
              return (
                <div key={resource.id} className="border border-white/15 bg-black/55 px-2 py-1 backdrop-blur-sm sm:px-3 sm:py-2">
                  <div className="flex items-center justify-between font-poster text-[9px] uppercase tracking-[.12em] sm:text-xs sm:tracking-[.18em]">
                    <span className="flex items-center gap-1 text-white/80">{resource.tone === 'life' ? <Heart className="h-3 w-3" /> : <Shield className="h-3 w-3" />} {resource.label}</span>
                    <b>{resource.current}<span className="text-white/40"> / {resource.max}</span></b>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15"><div className={`h-full bg-gradient-to-r ${resourceTone[resource.tone] ?? resourceTone.neutral}`} style={{ width: `${percentage}%` }} /></div>
                </div>
              );
            })}
          </div>

          {trained.length > 0 && (
            <div className="mt-auto pt-3 sm:pt-6">
              <div className="mb-2 flex items-center gap-2 font-poster text-xs uppercase tracking-[.26em]" style={{ color: 'var(--sheet-accent)' }}><span className="h-px flex-1 bg-white/20" /> Perícias <span className="h-px flex-1 bg-white/20" /></div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0 border-l-2 pl-2 sm:gap-x-5 sm:pl-3" style={{ borderColor: 'var(--sheet-accent)' }}>
                {trained.map(skill => <div key={skill.id} className="flex justify-between gap-1 border-b border-white/10 py-0.5 font-body text-[9px] sm:text-xs"><span className="truncate text-white/80">{skill.name}</span><b style={{ color: 'var(--sheet-accent)' }}>{skill.value >= 0 ? '+' : ''}{skill.value}</b></div>)}
              </div>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col justify-end pb-1 pt-24 sm:pt-32 md:pt-24">
          {sheet.abilities.length > 0 && <div className="space-y-2 sm:space-y-3">
            {sheet.abilities.map((ability, index) => (
              <div key={ability.id} className="relative overflow-hidden bg-[#e8e5da] text-[#171717] shadow-[0_8px_18px_rgba(0,0,0,.45)]" style={{ clipPath: 'polygon(1% 5%, 98% 0, 100% 88%, 96% 100%, 3% 95%, 0 15%)', transform: `rotate(${index % 2 === 0 ? '-.7' : '.5'}deg)` }}>
                <div className="flex items-center justify-between gap-2 bg-[#d7d2c4] px-3 py-1.5 sm:px-4 sm:py-2"><h2 className="font-elegant text-base font-bold uppercase leading-none sm:text-xl">{ability.name}</h2>{ability.cost && <span className="font-poster text-xs text-[#6f1618] sm:text-sm">{ability.cost}</span>}</div>
                {ability.description && <p className="px-3 pb-2 pt-1 font-body text-[10px] leading-tight text-black/80 sm:px-4 sm:pb-3 sm:text-xs sm:leading-relaxed">{ability.description}</p>}
                <span className="absolute bottom-0 right-2 font-gothic text-2xl text-black/20">✦</span>
              </div>
            ))}
          </div>}

          {sheet.notes && <div className="mt-4 border border-white/15 bg-black/45 p-3 font-elegant text-sm italic leading-relaxed text-white/75 backdrop-blur-sm">{sheet.notes}</div>}
          <div className="mt-5 flex items-end justify-between border-t border-white/20 pt-3 font-poster text-[10px] uppercase tracking-[.22em] text-white/55"><span>{system.name}</span><span>Ficha de personagem</span></div>
        </section>
      </div>
    </article>
  );
};
