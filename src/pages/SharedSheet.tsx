import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Pencil, Eye, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SheetPoster } from '@/components/sheet/SheetPoster';
import { Sheet, SheetStyle, STYLE_COLORS, getSheetByShareId, updateSharedSheet } from '@/lib/sheets';

const FONTS: { id: NonNullable<SheetStyle['font']>; label: string }[] = [
  { id: 'display', label: 'Medieval' },
  { id: 'serif', label: 'Clássica' },
  { id: 'sans', label: 'Moderna' },
  { id: 'mono', label: 'Máquina' },
];

/** Página pública: o jogador vê, edita e personaliza só a ficha dele. */
const SharedSheet = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [styling, setStyling] = useState(false);
  const dirty = useRef(false);
  const saveT = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!shareId) return;
    let alive = true;
    getSheetByShareId(shareId)
      .then(s => { if (alive) setSheet(s); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });

    // Tempo real: quando o mestre mexe na ficha, aparece aqui na hora
    const channel = supabase
      .channel(`shared-sheet-${shareId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sheets', filter: `share_id=eq.${shareId}` },
        (payload) => {
          if (dirty.current) return; // não pisa em cima do que o jogador está editando
          const row = payload.new as any;
          setSheet({
            ...row,
            attributes: row.attributes ?? [], skills: row.skills ?? [],
            resources: row.resources ?? [], abilities: row.abilities ?? [],
            style: row.style ?? {},
          });
        })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [shareId]);

  const patch = (p: Partial<Sheet>) => {
    if (!shareId) return;
    dirty.current = true;
    setSheet(prev => (prev ? { ...prev, ...p } : prev));
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      updateSharedSheet(shareId, p).catch(() => {}).finally(() => { dirty.current = false; });
    }, 600);
  };

  const patchStyle = (p: Partial<SheetStyle>) => sheet && patch({ style: { ...sheet.style, ...p } });

  return (
    <div className="min-h-[100dvh] bg-background p-3 md:p-8">
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-20 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando ficha...
          </div>
        ) : !sheet ? (
          <div className="text-center py-20">
            <h1 className="page-title">Ficha não encontrada</h1>
            <p className="text-sm text-muted-foreground mt-2">Confira o link com o seu mestre.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end gap-2 mb-3">
              <Button size="sm" variant={styling ? 'default' : 'outline'} className="gap-1.5" onClick={() => setStyling(v => !v)}>
                <Palette className="w-3.5 h-3.5" /> Visual
              </Button>
              <Button size="sm" variant={editing ? 'default' : 'outline'} className="gap-1.5" onClick={() => setEditing(v => !v)}>
                {editing ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {editing ? 'Só olhar' : 'Editar minha ficha'}
              </Button>
            </div>

            {styling && (
              <div className="mb-4 rounded-xl border border-border/60 bg-card/60 p-4 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Cor da ficha</p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_COLORS.map(c => (
                      <button
                        key={c.hsl}
                        title={c.label}
                        onClick={() => patchStyle({ color: c.hsl })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${sheet.style.color === c.hsl ? 'border-foreground' : 'border-transparent'}`}
                        style={{ background: `hsl(${c.hsl})` }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Fonte do nome</p>
                  <div className="flex flex-wrap gap-2">
                    {FONTS.map(f => (
                      <Button key={f.id} size="sm" variant={sheet.style.font === f.id ? 'default' : 'outline'}
                        onClick={() => patchStyle({ font: f.id })}>{f.label}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Imagem do personagem</p>
                  <div className="flex flex-wrap gap-2">
                    {([['right', 'À direita'], ['left', 'À esquerda'], ['full', 'Fundo inteiro']] as const).map(([id, label]) => (
                      <Button key={id} size="sm" variant={(sheet.style.layout ?? 'right') === id ? 'default' : 'outline'}
                        onClick={() => patchStyle({ layout: id })}>{label}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Fundo escuro: {sheet.style.overlay ?? 55}%</p>
                  <input type="range" min={0} max={90} value={sheet.style.overlay ?? 55}
                    className="w-full accent-primary" onChange={e => patchStyle({ overlay: Number(e.target.value) })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sheet.style.uppercase ?? true}
                    onChange={e => patchStyle({ uppercase: e.target.checked })} className="accent-primary" />
                  Nome em letras maiúsculas
                </label>
              </div>
            )}

            <SheetPoster sheet={sheet} editable={editing} onPatch={patch} />
            <p className="text-center text-xs text-muted-foreground mt-4">
              {editing
                ? 'Suas alterações salvam sozinhas e aparecem para o mestre na hora.'
                : 'Toque em "Editar minha ficha" para ajustar vida, atributos e perícias — ou em "Visual" para deixar a ficha com a sua cara.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedSheet;
