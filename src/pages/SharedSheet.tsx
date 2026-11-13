import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/NumberInput';
import { SheetPoster } from '@/components/sheet/SheetPoster';
import { DiceAnimation, DiceBar, Roll } from '@/components/DiceBar';
import { Sheet, getSheetByShareId, updateSharedSheet } from '@/lib/sheets';

/** Página pública: o jogador vê e edita só a ficha dele. */
const SharedSheet = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [localRoll, setLocalRoll] = useState<Roll | null>(null);
  const dirty = useRef(false);
  const saveT = useRef<ReturnType<typeof setTimeout>>();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!shareId) return;
    let alive = true;
    const load = async () => {
      if (loadingRef.current || document.hidden) return;
      loadingRef.current = true;
      try {
        const s = await getSheetByShareId(shareId);
        if (alive && !dirty.current) setSheet(s);
      } catch { /* mantém a última versão visível durante uma falha breve */ }
      finally {
        loadingRef.current = false;
        if (alive) setLoading(false);
      }
    };

    load();
    const poll = setInterval(load, 10000);
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
    <div className="min-h-[100dvh] bg-background p-3 pb-24 md:p-8 md:pb-24">
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
            <SheetPoster
              sheet={sheet}
              editable={editing}
              onPatch={patch}
              onRoll={roll => { setLocalRoll(roll); patch({ last_roll: roll }); }}
            />
            {editing && (
              <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-card/70 p-4">
                <div><h2 className="font-display text-lg font-bold text-primary">Editar minha ficha</h2><p className="text-xs text-muted-foreground">Você pode ajustar suas perícias, habilidades, inventário e anotações. O mestre continua controlando o link e o sistema.</p></div>
                <section className="space-y-2">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Perícias</h3><Button size="sm" variant="outline" onClick={() => patch({ skills: [...sheet.skills, { id: Math.random().toString(36).slice(2, 10), name: 'Nova perícia', value: 0, trained: false }] })}>Adicionar</Button></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sheet.skills.map(skill => <div key={skill.id} className="grid grid-cols-[1fr_4.5rem_auto] items-center gap-2"><Input value={skill.name} onChange={e => patch({ skills: sheet.skills.map(item => item.id === skill.id ? { ...item, name: e.target.value } : item) })} placeholder="Perícia" /><NumberInput value={skill.value} onChange={value => patch({ skills: sheet.skills.map(item => item.id === skill.id ? { ...item, value } : item) })} /><Button size="sm" variant={skill.trained ? 'default' : 'outline'} onClick={() => patch({ skills: sheet.skills.map(item => item.id === skill.id ? { ...item, trained: !item.trained } : item) })}>{skill.trained ? 'Treinada' : 'Treinar'}</Button></div>)}
                  </div>
                </section>
                <section className="space-y-2">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Habilidades e poderes</h3><Button size="sm" variant="outline" onClick={() => patch({ abilities: [...sheet.abilities, { id: Math.random().toString(36).slice(2, 10), name: 'Nova habilidade', cost: '', description: '' }] })}>Adicionar</Button></div>
                  {sheet.abilities.map(ability => <div key={ability.id} className="space-y-2 rounded-lg border border-border/60 p-2"><div className="flex gap-2"><Input value={ability.name} onChange={e => patch({ abilities: sheet.abilities.map(item => item.id === ability.id ? { ...item, name: e.target.value } : item) })} placeholder="Nome" /><Input value={ability.cost} onChange={e => patch({ abilities: sheet.abilities.map(item => item.id === ability.id ? { ...item, cost: e.target.value } : item) })} placeholder="Custo" /></div><Textarea rows={2} value={ability.description} onChange={e => patch({ abilities: sheet.abilities.map(item => item.id === ability.id ? { ...item, description: e.target.value } : item) })} placeholder="Descrição" /></div>)}
                </section>
                <section className="space-y-2"><h3 className="text-sm font-semibold">Anotações</h3><Textarea rows={3} value={sheet.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Anotações da personagem" /></section>
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground mt-4">
              {editing
                ? 'Suas alterações salvam sozinhas e aparecem para o mestre.'
                : 'Toque em "Editar minha ficha" para ajustar vida, atributos e perícias.'}
            </p>
          </>
        )}
      </div>
      {sheet && (
        <div className="fixed inset-x-2 bottom-2 z-40 flex justify-center pb-[env(safe-area-inset-bottom)]">
          <DiceBar
            compact
            onRoll={roll => {
              const playerRoll = { ...roll, by: sheet.name };
              setLocalRoll(playerRoll);
              patch({ last_roll: playerRoll });
            }}
          />
        </div>
      )}
      <DiceAnimation roll={localRoll ?? sheet?.last_roll ?? null} />
    </div>
  );
};

export default SharedSheet;
