import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetPoster } from '@/components/sheet/SheetPoster';
import { Sheet, getSheetByShareId, updateSharedSheet } from '@/lib/sheets';

/** Página pública: o jogador vê e edita só a ficha dele. */
const SharedSheet = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const dirty = useRef(false);
  const saveT = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!shareId) return;
    let alive = true;
    const load = () =>
      getSheetByShareId(shareId)
        .then(s => { if (alive && !dirty.current) setSheet(s); })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false); });

    load();
    const poll = setInterval(load, 5000);
    return () => { alive = false; clearInterval(poll); };
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
            <div className="flex justify-end mb-3">
              <Button size="sm" variant={editing ? 'default' : 'outline'} className="gap-1.5" onClick={() => setEditing(v => !v)}>
                {editing ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {editing ? 'Só olhar' : 'Editar minha ficha'}
              </Button>
            </div>
            <SheetPoster sheet={sheet} editable={editing} onPatch={patch} />
            <p className="text-center text-xs text-muted-foreground mt-4">
              {editing
                ? 'Suas alterações salvam sozinhas e aparecem para o mestre.'
                : 'Toque em "Editar minha ficha" para ajustar vida, atributos e perícias.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedSheet;
