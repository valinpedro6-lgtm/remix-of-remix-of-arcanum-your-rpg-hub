import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SheetPoster } from '@/components/sheet/SheetPoster';
import { Sheet, getSheetByShareId } from '@/lib/sheets';
import { supabase } from '@/integrations/supabase/client';

/** Página pública: o jogador vê só a ficha dele, sem poder editar. */
const SharedSheet = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId) return;
    let alive = true;
    const load = () =>
      getSheetByShareId(shareId)
        .then(s => { if (alive) setSheet(s); })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false); });

    load();

    const channel = supabase
      .channel(`sheet-${shareId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sheets' }, payload => {
        const row: any = payload.new;
        if (row?.share_id === shareId) setSheet(prev => (prev ? { ...prev, ...row } : prev));
      })
      .subscribe();

    const poll = setInterval(load, 15000);
    return () => { alive = false; clearInterval(poll); supabase.removeChannel(channel); };
  }, [shareId]);

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
            <SheetPoster sheet={sheet} />
            <p className="text-center text-xs text-muted-foreground mt-4">
              Ficha só para visualização — o mestre atualiza os valores em tempo real.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedSheet;
