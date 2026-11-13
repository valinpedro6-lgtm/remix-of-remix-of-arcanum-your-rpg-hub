import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Skull, Plus, Trash2, Link2, Copy, Maximize2, Minimize2, ArrowUp, ArrowDown,
  PanelsTopLeft, Save, ArrowLeft, Send, Loader2, ImagePlus, BookOpen, Palette, Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { NumberInput } from '@/components/NumberInput';
import { SheetPoster } from '@/components/sheet/SheetPoster';
import {
  Sheet, SheetAbility, SheetAttribute, SheetResource, SheetSkill, SheetStyle,
  createSheet, deleteSheet, listSheets, updateSheet, uid, shareUrl, listSheetTemplates, saveSheetTemplate, deleteSheetTemplate, SheetTemplate,
  SheetKind, STYLE_COLORS,
} from '@/lib/sheets';
import { SHEET_SYSTEMS, getSystem, systemTemplate } from '@/lib/sheetSystems';
import { compressImage } from '@/lib/image';
import { clearDraft, readDraft, saveDraft } from '@/lib/drafts';

const TONES: SheetResource['tone'][] = ['life', 'sanity', 'effort', 'neutral'];
const TONE_LABEL: Record<SheetResource['tone'], string> = {
  life: 'Vermelho', sanity: 'Azul', effort: 'Dourado', neutral: 'Cinza',
};

const degreeOptions = (system?: string) => {
  if (system === 'ordemparanormal') return [['destreinado', 'Destreinado'], ['treinado', 'Treinado'], ['veterano', 'Veterano'], ['expert', 'Expert']];
  if (system === 'ordemparanormal2-alpha') return [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12']];
  if (system === 'dnd5e') return [['untrained', 'Sem proficiência'], ['proficient', 'Proficiência'], ['expertise', 'Expertise']];
  if (system === 'tormenta20') return [['untrained', 'Não treinada'], ['trained', 'Treinada']];
  if (system === 'pf2e') return [['untrained', 'Destreinado'], ['trained', 'Treinado'], ['expert', 'Expert'], ['master', 'Mestre'], ['legendary', 'Lendário']];
  if (system === 'cthulhu') return [['regular', 'Regular / valor %'], ['hard', 'Difícil / metade'], ['extreme', 'Extremo / quinto']];
  if (system === 'savageworlds') return [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12']];
  return [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']];
};

const kindFromTemplate = (template: SheetTemplate): SheetKind => template.kind === 'monster' ? 'monster' : template.kind === 'story' ? 'story' : 'player';

const sendToInitiative = (sheet: Sheet) => {
  const life = sheet.resources.find(r => r.tone === 'life' || /vida|pv|hp/i.test(`${r.label} ${r.short}`));
  const initiative = sheet.skills.find(s => /iniciativa/i.test(s.name));
  const pending = JSON.parse(localStorage.getItem('arcanum-initiative-inbox') ?? '[]');
  const next = [...pending.filter((item: { sourceSheetId?: string }) => item.sourceSheetId !== sheet.id), {
    sourceSheetId: sheet.id,
    name: sheet.name || 'Sem nome',
    initiative: sheet.initiative ?? initiative?.value ?? 0,
    hp: life?.current ?? 0,
    maxHp: life?.max ?? life?.current ?? 0,
    type: sheet.kind === 'monster' ? 'monster' : 'player',
  }];
  localStorage.setItem('arcanum-initiative-inbox', JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'arcanum-initiative-inbox', value: next } }));
  toast.success(`${sheet.name || 'Ficha'} enviada para a Iniciativa.`);
};

const Cast = () => {
  const [searchParams] = useSearchParams();
  const [newSystem, setNewSystem] = useState(() => localStorage.getItem('arcanum-sheet-system') ?? 'ordemparanormal');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState(() => searchParams.get('t') === 'monstros' ? 'monster' : searchParams.get('t') === 'projetar' ? 'table' : 'player');
  const [full, setFull] = useState(false);
  const [templates, setTemplates] = useState<SheetTemplate[]>(() => listSheetTemplates());
  const stageRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    listSheets()
      .then(rows => {
        let recovered = 0;
        const next = rows.map(row => {
          const draft = readDraft<Sheet>('sheet', row.id, row.updated_at);
          if (!draft) return row;
          recovered += 1;
          return { ...row, ...draft.value, id: row.id, share_id: row.share_id, created_at: row.created_at, updated_at: row.updated_at };
        });
        if (recovered) toast.info(`${recovered} rascunho(s) local(is) recuperado(s).`);
        setSheets(next);
      })
      .catch(() => toast.error('Não consegui carregar as fichas.'))
      .finally(() => setLoading(false));
  }, []);

  // Atualização rápida para refletir alterações feitas na ficha compartilhada.
  const pending = useRef<Record<string, number>>({});
  const syncing = useRef(false);
  useEffect(() => {
    const sync = () => {
      if (document.hidden || syncing.current) return;
      syncing.current = true;
      listSheets().then(fresh => setSheets(prev => {
        const now = Date.now();
        return fresh.map(f => {
          const local = prev.find(p => p.id === f.id);
          return local && (pending.current[f.id] ?? 0) > now ? local : f;
        });
      })).catch(() => {}).finally(() => { syncing.current = false; });
    };
    const t = setInterval(sync, 15000);
    return () => clearInterval(t);
  }, []);

  const selected = sheets.find(s => s.id === selectedId) ?? null;
  const players = useMemo(() => sheets.filter(s => s.kind === 'player'), [sheets]);
  const story = useMemo(() => sheets.filter(s => s.kind === 'story'), [sheets]);
  const monsters = useMemo(() => sheets.filter(s => s.kind === 'monster'), [sheets]);
  const onTable = useMemo(() => sheets.filter(s => s.in_list), [sheets]);

  /** Atualiza localmente na hora e salva na nuvem com um pequeno atraso. */
  const patch = (id: string, p: Partial<Sheet>) => {
    pending.current[id] = Date.now() + 3000;
    const current = sheets.find(s => s.id === id);
    const next = current ? { ...current, ...p } : null;
    if (next) saveDraft('sheet', id, next);
    setSheets(prev => prev.map(s => (s.id === id ? { ...s, ...p } : s)));
    clearTimeout(saveTimer.current[id]);
    saveTimer.current[id] = setTimeout(() => {
      updateSheet(id, p)
        .then(() => {
          clearDraft('sheet', id);
          window.dispatchEvent(new CustomEvent('arcanum:sheets-updated'));
        })
        .catch(() => toast.error('Não consegui salvar. O rascunho local foi mantido.'));
    }, 500);
  };

  const add = async (kind: SheetKind) => {
    try {
      localStorage.setItem('arcanum-sheet-system', newSystem);
      const s = await createSheet(kind, newSystem);
      setSheets(prev => [...prev, s]);
      setSelectedId(s.id);
      window.dispatchEvent(new CustomEvent('arcanum:sheets-updated'));
      toast.success(kind === 'monster' ? 'Criatura criada!' : 'Personagem criado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não consegui criar a ficha.');
    }
  };

  const addFromTemplate = async (template: SheetTemplate) => {
    try {
      const kind = kindFromTemplate(template);
      const system = template.system ?? newSystem;
      const created = await createSheet(kind, system);
      const source = JSON.parse(JSON.stringify(template.source)) as Partial<Sheet>;
      const patchData: Partial<Sheet> = { ...source, kind, style: { ...(source.style ?? {}), system }, name: source.name || template.name.replace(/\s+—\s+modelo$/i, ''), in_list: false, last_roll: null };
      await updateSheet(created.id, patchData);
      setSheets(prev => [...prev, { ...created, ...patchData } as Sheet]);
      setSelectedId(created.id);
      toast.success(`Ficha criada a partir de “${template.name}”.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não consegui usar o modelo.'); }
  };

  const remove = async (id: string) => {
    await deleteSheet(id).catch(() => toast.error('Não consegui apagar.'));
    setSheets(prev => prev.filter(s => s.id !== id));
    window.dispatchEvent(new CustomEvent('arcanum:sheets-updated'));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleFull = async () => {
    if (!document.fullscreenElement) {
      await stageRef.current?.requestFullscreen?.().catch(() => {});
      setFull(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFull(false);
    }
  };

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const uploadImage = async (file: File | undefined) => {
    if (!file || !selected) return;
    if (file.type !== 'image/png') {
      toast.info('Prefira uma imagem PNG (fundo transparente fica muito melhor na ficha).');
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 4MB).');
      return;
    }
    try {
      patch(selected.id, { image_url: await compressImage(file, { maxDimension: 1400, maxBytes: 1_500_000 }) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não consegui preparar a imagem.');
    }
  };

  /* ---------- Lista ---------- */
  const grid = (items: Sheet[], kind: SheetKind) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
      <select value={newSystem} onChange={e => setNewSystem(e.target.value)} aria-label="Sistema da ficha"
        className="h-10 rounded-md border border-input bg-background px-3 text-sm max-w-full">
        {SHEET_SYSTEMS.map(sys => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
      </select>
      <Button onClick={() => add(kind)} className="gap-2">
        <Plus className="w-4 h-4" />
        {kind === 'monster' ? 'Nova criatura' : kind === 'story' ? 'Novo personagem da história' : 'Novo jogador'}
      </Button>
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <div className="mr-auto"><p className="text-sm font-semibold">Modelos reutilizáveis</p><p className="text-xs text-muted-foreground">Salve uma ficha original e use a mesma estrutura quantas vezes quiser.</p></div>
          {templates.map(template => <div key={template.id} className="flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1"><span className="max-w-32 truncate text-xs">{template.name}</span><Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => addFromTemplate(template)}>Usar</Button><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => { deleteSheetTemplate(template.id); setTemplates(listSheetTemplates()); }}>×</Button></div>)}
          <span className="text-xs text-muted-foreground">Abra uma ficha para salvar um novo modelo.</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando fichas...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">Nenhuma ficha ainda. Crie a primeira!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <button className="text-left w-full" onClick={() => setSelectedId(s.id)}>
                <div className="relative rounded-xl overflow-hidden border border-border/50 bg-black h-44 group">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="absolute inset-0 w-full h-full object-cover object-top opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      {kind !== 'monster' ? <Users className="w-12 h-12 text-primary" /> : <Skull className="w-12 h-12 text-primary" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display font-black uppercase text-primary text-lg leading-none drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]">
                      {s.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {s.resources.slice(0, 3).map(r => (
                        <Badge key={r.id} variant="outline" className="text-[10px] border-primary/30 text-white/80">
                          {r.short} {r.current}/{r.max}
                        </Badge>
                      ))}
                      {s.in_list && <Badge className="text-[10px]">Na mesa</Badge>}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  /* ---------- Editor ---------- */
  if (selected) {
    const s = selected;
    const setAttr = (list: SheetAttribute[]) => patch(s.id, { attributes: list });
    const setSkills = (list: SheetSkill[]) => patch(s.id, { skills: list });
    const setRes = (list: SheetResource[]) => patch(s.id, { resources: list });
    const setAb = (list: SheetAbility[]) => patch(s.id, { abilities: list });
    const reorderAttributes = (fromId: string, toId: string) => {
      const next = [...s.attributes];
      const from = next.findIndex(attribute => attribute.id === fromId);
      const to = next.findIndex(attribute => attribute.id === toId);
      if (from < 0 || to < 0) return;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setAttr(next);
    };
    const blockLabels: Record<string, string> = {
      abilities: 'Habilidades', skills: 'Perícias', inventory: 'Inventário', notes: 'Anotações',
    };
    const blockOrder = s.style.blockOrder ?? ['abilities', 'skills', 'inventory', 'notes'];
    const moveBlock = (id: string, direction: -1 | 1) => {
      const from = blockOrder.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= blockOrder.length) return;
      const next = [...blockOrder];
      [next[from], next[to]] = [next[to], next[from]];
      patch(s.id, { style: { ...s.style, blockOrder: next } });
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex-1" />
          <Button
            variant={s.in_list ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => patch(s.id, { in_list: !s.in_list })}
          >
            <Send className="w-3.5 h-3.5" /> {s.in_list ? 'Na mesa' : 'Mandar pra mesa'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => sendToInitiative(s)}>
            <Swords className="w-3.5 h-3.5" /> Iniciativa
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => {
            navigator.clipboard.writeText(shareUrl(s.share_id));
            toast.success('Link copiado! O jogador só vê essa ficha.');
          }}>
            <Link2 className="w-3.5 h-3.5" /> Link do jogador
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => { const name = window.prompt('Nome do modelo:', `${s.name || 'Ficha'} — modelo`); if (!name) return; saveSheetTemplate(s, name); setTemplates(listSheetTemplates()); toast.success('Modelo salvo.'); }}>
            <BookOpen className="w-3.5 h-3.5" /> Salvar modelo
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={toggleFull}>
            {full ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />} Projetor
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => remove(s.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div ref={stageRef} className={full ? 'bg-black p-4 flex items-center overflow-auto' : ''}>
          <div className="w-full">
            <SheetPoster
              sheet={s}
              editable
              onPatch={p => patch(s.id, p)}
              onRoll={roll => patch(s.id, { last_roll: roll })}
              onReorderAttributes={reorderAttributes}
            />
          </div>
        </div>

        {!full && (
          <Card>
            <CardContent className="p-4 space-y-6">
              {/* Identidade */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={s.name} onChange={e => patch(s.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Origem / classe</Label>
                  <Input value={s.origin} onChange={e => patch(s.id, { origin: e.target.value })} placeholder="Ex: Combatente — Militar" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Frase de efeito</Label>
                  <Input value={s.subtitle} onChange={e => patch(s.id, { subtitle: e.target.value })} placeholder="O sangue podia até pagar bem, mas..." />
                </div>
                {s.style.system === 'ordemparanormal2-alpha' && <>
                  <div className="md:col-span-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
                    <strong className="text-primary">Ordem Paranormal II — Playtest Alpha.</strong> Esta ficha usa Físico, Mente, Emoção, Vida, PD e os campos do material de teste. Ela não converte automaticamente uma ficha da edição anterior.
                  </div>
                  <div className="space-y-1.5"><Label>Idade</Label><Input value={s.age ?? ''} onChange={e => patch(s.id, { age: e.target.value })} placeholder="Ex: 27" /></div>
                  <div className="space-y-1.5"><Label>Ocupação</Label><Input value={s.occupation ?? ''} onChange={e => patch(s.id, { occupation: e.target.value })} placeholder="Ex: Perita criminal" /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Perfil</Label><Input value={s.profile ?? ''} onChange={e => patch(s.id, { profile: e.target.value })} placeholder="Executor, Analista ou Vigilante" /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Histórico e conceito</Label><Textarea value={s.background ?? ''} onChange={e => patch(s.id, { background: e.target.value })} placeholder="Quem era essa pessoa antes do caso? O que ela teme perder?" /></div>
                </>}
              </div>

              {/* Progressão */}
              <div className="grid gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 sm:grid-cols-3">
                <div className="space-y-1.5"><Label>Nível</Label><NumberInput value={s.level} onChange={v => patch(s.id, { level: Math.max(1, v) })} /></div>
                <div className="space-y-1.5"><Label>XP atual</Label><NumberInput value={s.xp} onChange={v => patch(s.id, { xp: Math.max(0, v) })} /></div>
                <div className="space-y-1.5"><Label>XP para o próximo nível</Label><NumberInput value={s.xp_goal} onChange={v => patch(s.id, { xp_goal: Math.max(1, v) })} /></div>
                <div className="space-y-1.5"><Label>Iniciativa</Label><NumberInput value={s.initiative ?? 0} onChange={v => patch(s.id, { initiative: v })} /></div>
                <div className="sm:col-span-3"><div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Progressão</span><span>{Math.min(100, Math.round((s.xp / Math.max(1, s.xp_goal)) * 100))}%</span></div><div className="h-2 overflow-hidden rounded-full bg-background/70"><div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--ember))] transition-all" style={{ width: `${Math.min(100, Math.round((s.xp / Math.max(1, s.xp_goal)) * 100))}%` }} /></div></div>
              </div>

              {/* Sistema */}
              <div className="space-y-1.5">
                <Label>Sistema de RPG</Label>
                <select value={s.style.system ?? 'ordemparanormal'} aria-label="Sistema de RPG"
                  onChange={e => {
                    const sys = e.target.value;
                    if (confirm(`Trocar para ${getSystem(sys).name}? Os atributos, recursos e perícias serão trocados pelos desse sistema.`)) {
                      const t = systemTemplate(sys);
                      patch(s.id, { style: { ...s.style, system: sys, color: undefined, font: undefined }, attributes: t.attributes, resources: t.resources, skills: s.kind === 'monster' ? s.skills : t.skills });
                    }
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {SHEET_SYSTEMS.map(sys => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">O visual da ficha muda de acordo com o sistema.</p>
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <Label>Onde fica essa ficha</Label>
                <div className="flex flex-wrap gap-2">
                  {([['player', 'Jogador da mesa'], ['story', 'Personagem da história'], ['monster', 'Monstro']] as [SheetKind, string][]).map(([k, l]) => (
                    <Button key={k} size="sm" variant={s.kind === k ? 'default' : 'outline'} onClick={() => patch(s.id, { kind: k })}>{l}</Button>
                  ))}
                </div>
              </div>

              {/* Layout */}
              <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <div>
                  <Label>Ordem dos blocos da ficha</Label>
                  <p className="text-xs text-muted-foreground">Monte a ficha do seu jeito: use as setas para reorganizar as seções.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {blockOrder.map((id, index) => (
                    <div key={id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <span className="text-sm font-medium">{index + 1}. {blockLabels[id]}</span>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveBlock(id, -1)} aria-label="Mover para cima"><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === blockOrder.length - 1} onClick={() => moveBlock(id, 1)} aria-label="Mover para baixo"><ArrowDown className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalizar */}
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Personalizar visual da ficha</Label>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Cor principal</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => patch(s.id, { style: { ...s.style, color: undefined } })}
                      className={`h-8 px-2 rounded-md border text-xs ${!s.style.color ? 'border-foreground' : 'border-border'}`}>Tema</button>
                    {STYLE_COLORS.map(c => (
                      <button key={c.hsl} type="button" title={c.label} aria-label={c.label}
                        onClick={() => patch(s.id, { style: { ...s.style, color: c.hsl } })}
                        className={`w-8 h-8 rounded-full border-2 ${s.style.color === c.hsl ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ background: `hsl(${c.hsl})` }} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Fonte do nome</p>
                    <select className="h-9 w-full rounded-md bg-background border border-border text-sm px-2" value={s.style.font ?? 'display'}
                      onChange={e => patch(s.id, { style: { ...s.style, font: e.target.value as SheetStyle['font'] } })}>
                      <option value="display">Medieval</option><option value="serif">Clássica</option>
                      <option value="sans">Moderna</option><option value="mono">Máquina</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Posição da imagem</p>
                    <select className="h-9 w-full rounded-md bg-background border border-border text-sm px-2" value={s.style.layout ?? 'right'}
                      onChange={e => patch(s.id, { style: { ...s.style, layout: e.target.value as SheetStyle['layout'] } })}>
                      <option value="right">Direita</option><option value="left">Esquerda</option><option value="full">Fundo inteiro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Escurecer fundo ({s.style.overlay ?? 50}%)</p>
                    <input type="range" min={0} max={100} className="w-full accent-primary" value={s.style.overlay ?? 50}
                      onChange={e => patch(s.id, { style: { ...s.style, overlay: Number(e.target.value) } })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={s.style.uppercase !== false} onCheckedChange={c => patch(s.id, { style: { ...s.style, uppercase: c } })} />
                  Nome em letras maiúsculas
                </label>
              </div>

              {/* Imagem */}
              <div className="space-y-2">
                <Label>Imagem do personagem</Label>
                <p className="text-xs text-muted-foreground">
                  Prefira uma imagem <strong>PNG</strong> — de preferência com fundo transparente, fica muito melhor atrás da ficha.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex">
                    <input type="file" accept="image/png,image/*" className="hidden" onChange={e => uploadImage(e.target.files?.[0])} />
                    <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-secondary/40 text-sm cursor-pointer hover:border-primary">
                      <ImagePlus className="w-4 h-4" /> Enviar PNG
                    </span>
                  </label>
                  <Input
                    className="flex-1 min-w-[200px]"
                    placeholder="ou cole uma URL de imagem"
                    value={s.image_url.startsWith('data:') ? '' : s.image_url}
                    onChange={e => patch(s.id, { image_url: e.target.value })}
                  />
                  {s.image_url && (
                    <Button variant="outline" size="sm" onClick={() => patch(s.id, { image_url: '' })}>Remover</Button>
                  )}
                </div>
              </div>

              {/* Atributos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Atributos ({s.attributes.length})</Label>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setAttr([...s.attributes, { id: uid(), label: 'Novo', short: 'NOV', value: 1 }])}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {s.attributes.map(a => (
                    <div key={a.id} className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-lg p-2">
                      <Input className="h-8" value={a.label} onChange={e => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, label: e.target.value } : x))} placeholder="Nome" />
                      <Input className="h-8" value={a.short} onChange={e => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, short: e.target.value.toUpperCase().slice(0, 4) } : x))} placeholder="SIGLA" />
                      <NumberInput className="h-8" value={a.value} onChange={v => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, value: v } : x))} />
                      <Input className="h-8" value={a.die ?? ''} onChange={e => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, die: e.target.value } : x))} placeholder="Dado (ex: d6)" />
                      <NumberInput className="h-8" value={a.modifier ?? 0} onChange={v => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, modifier: v } : x))} />
                      <div className="flex gap-2">
                        <Input className="h-8 flex-1" value={a.notes ?? ''} onChange={e => setAttr(s.attributes.map(x => x.id === a.id ? { ...x, notes: e.target.value } : x))} placeholder="Nota / fonte" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setAttr(s.attributes.filter(x => x.id !== a.id))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recursos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vida, sanidade e outros</Label>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setRes([...s.resources, { id: uid(), label: 'Novo', short: 'NOV', current: 10, max: 10, tone: 'neutral' }])}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {s.resources.map(r => (
                    <div key={r.id} className="flex flex-wrap items-center gap-2 bg-secondary/30 rounded-lg p-2">
                      <Input className="h-8 flex-1 min-w-[110px]" value={r.label} onChange={e => setRes(s.resources.map(x => x.id === r.id ? { ...x, label: e.target.value } : x))} />
                      <Input className="h-8 w-20" value={r.short} onChange={e => setRes(s.resources.map(x => x.id === r.id ? { ...x, short: e.target.value.toUpperCase().slice(0, 5) } : x))} />
                      <NumberInput className="h-8 w-20" value={r.current} onChange={v => setRes(s.resources.map(x => x.id === r.id ? { ...x, current: v } : x))} />
                      <span className="text-muted-foreground">/</span>
                      <NumberInput className="h-8 w-20" value={r.max} onChange={v => setRes(s.resources.map(x => x.id === r.id ? { ...x, max: v } : x))} />
                      <select
                        className="h-8 rounded-md bg-background border border-border text-sm px-2"
                        value={r.tone}
                        onChange={e => setRes(s.resources.map(x => x.id === r.id ? { ...x, tone: e.target.value as SheetResource['tone'] } : x))}
                      >
                        {TONES.map(t => <option key={t} value={t}>{TONE_LABEL[t]}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRes(s.resources.filter(x => x.id !== r.id))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habilidades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Habilidades / poderes</Label>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setAb([...s.abilities, { id: uid(), name: 'Nova habilidade', cost: '', description: '', type: 'damage', formula: '1d20', target: 'single' }])}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                {s.abilities.map(ab => (
                  <div key={ab.id} className="space-y-2 bg-secondary/30 rounded-lg p-2">
                    <div className="grid gap-2 sm:grid-cols-[1fr_7rem_8rem_auto]">
                      <Input className="h-8 flex-1" value={ab.name} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, name: e.target.value } : x))} placeholder="Nome" />
                      <Input className="h-8 w-24" value={ab.cost} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, cost: e.target.value } : x))} placeholder="3 PD" />
                      <Input className="h-8" value={ab.formula ?? ''} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, formula: e.target.value } : x))} placeholder="2d6 + Força" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setAb(s.abilities.filter(x => x.id !== ab.id))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="h-8 rounded-md border border-border bg-background px-2 text-sm" value={ab.type ?? 'utility'} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, type: e.target.value as SheetAbility['type'] } : x))}>
                        <option value="damage">Dano</option><option value="heal">Cura</option><option value="passive">Passiva</option><option value="utility">Utilidade</option>
                      </select>
                      <select className="h-8 rounded-md border border-border bg-background px-2 text-sm" value={ab.target ?? 'single'} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, target: e.target.value as SheetAbility['target'] } : x))}>
                        <option value="single">Alvo único</option><option value="multiple">Múltiplos alvos</option><option value="area">Área</option>
                      </select>
                    </div>
                    <Textarea rows={2} value={ab.description} onChange={e => setAb(s.abilities.map(x => x.id === ab.id ? { ...x, description: e.target.value } : x))} placeholder="O que essa habilidade faz" />
                  </div>
                ))}
              </div>

              {/* Inventário */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Inventário {(s.style.inventory?.length ?? 0) > 0 && <span className="text-muted-foreground text-xs">· peso total {(s.style.inventory ?? []).reduce((a, i) => a + (i.weight ?? 0) * i.qty, 0)}</span>}</Label>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => patch(s.id, { style: { ...s.style, inventory: [...(s.style.inventory ?? []), { id: uid(), name: 'Novo item', qty: 1, weight: 0, note: '' }] } })}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                {(s.style.inventory ?? []).map(it => {
                  const setInv = (ch: Partial<typeof it> | null) => patch(s.id, { style: { ...s.style, inventory: ch === null ? (s.style.inventory ?? []).filter(x => x.id !== it.id) : (s.style.inventory ?? []).map(x => x.id === it.id ? { ...x, ...ch } : x) } });
                  return (
                    <div key={it.id} className="flex flex-wrap items-center gap-2 bg-secondary/30 rounded-lg p-2">
                      <Input className="h-8 flex-1 min-w-[120px]" value={it.name} onChange={e => setInv({ name: e.target.value })} placeholder="Item" />
                      <NumberInput className="h-8 w-14" value={it.qty} onChange={v => setInv({ qty: v })} />
                      <NumberInput className="h-8 w-14" value={it.weight ?? 0} onChange={v => setInv({ weight: v })} />
                      <Input className="h-8 flex-1 min-w-[100px]" value={it.note ?? ''} onChange={e => setInv({ note: e.target.value })} placeholder="Detalhe" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setInv(null)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  );
                })}
                {(s.style.inventory?.length ?? 0) > 0 && <p className="text-xs text-muted-foreground">Colunas: item · quantidade · peso · detalhe</p>}
              </div>

              {/* Perícias */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Perícias</Label>
                  <div className="flex gap-2">
                    {s.skills.length === 0 && (
                      <Button size="sm" variant="outline" onClick={() => setSkills(systemTemplate(s.style.system ?? 'custom').skills)}>
                        Usar lista de {getSystem(s.style.system).name}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setSkills([...s.skills, { id: uid(), name: 'Nova perícia', value: 0 }])}>
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Cada perícia mantém o atributo, grau, dado, especialização e modificadores próprios do sistema selecionado.</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {s.skills.map(sk => (
                    <div key={sk.id} className="space-y-2 bg-secondary/30 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Input className="h-8 flex-1" value={sk.name} onChange={e => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, name: e.target.value } : x))} />
                        <NumberInput className="h-8 w-16" value={sk.value} onChange={v => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, value: v } : x))} />
                        <Switch checked={!!sk.trained} onCheckedChange={c => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, trained: c } : x))} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSkills(s.skills.filter(x => x.id !== sk.id))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select aria-label={`Atributo de ${sk.name}`} className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={sk.attribute ?? ''} onChange={e => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, attribute: e.target.value || undefined } : x))}>
                          <option value="">Atributo ligado</option>
                          {s.attributes.map(attribute => <option key={attribute.id} value={attribute.short}>{attribute.short} — {attribute.label}</option>)}
                        </select>
                        <select aria-label={`Grau de ${sk.name}`} className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={sk.degree ?? ''} onChange={e => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, degree: e.target.value || undefined, proficiency: e.target.value || undefined, die: /^d\\d+$/.test(e.target.value) ? e.target.value : x.die } : x))}>
                          <option value="">Grau / dado</option>
                          {degreeOptions(s.style.system).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-[1fr_5rem] gap-2">
                        <Input className="h-8" value={sk.specialization ?? ''} onChange={e => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, specialization: e.target.value } : x))} placeholder="Especialização / observação" />
                        <NumberInput className="h-8" value={sk.modifiers ?? 0} onChange={v => setSkills(s.skills.map(x => x.id === sk.id ? { ...x, modifiers: v } : x))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label>Anotações</Label>
                <Textarea rows={3} value={s.notes} onChange={e => patch(s.id, { notes: e.target.value })} />
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="w-3 h-3" /> Tudo é salvo sozinho na nuvem.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ---------- Visão geral ---------- */
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Elenco & Fichas</h1>
        <p className="text-sm text-muted-foreground mt-1">O centro completo de personagens da ARCANUM: fichas, edição, compartilhamento e projeção.</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="w-full overflow-x-auto no-scrollbar"><TabsList className="w-max min-w-full flex justify-start h-auto p-1 bg-card/60 backdrop-blur-md border border-border/50">
          <TabsTrigger value="player" className="flex-1 gap-2 py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Users className="w-4 h-4" /> <span className="sm:hidden">Jogadores</span><span className="hidden sm:inline">Jogadores da mesa</span>
          </TabsTrigger>
          <TabsTrigger value="story" className="flex-1 gap-2 py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <BookOpen className="w-4 h-4" /> <span className="sm:hidden">História</span><span className="hidden sm:inline">Personagens da história</span>
          </TabsTrigger>
          <TabsTrigger value="monster" className="flex-1 gap-2 py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Skull className="w-4 h-4" /> Monstros
          </TabsTrigger>
          <TabsTrigger value="table" className="flex-1 gap-2 py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <PanelsTopLeft className="w-4 h-4" /> Projetar
          </TabsTrigger>
        </TabsList></div>

        <TabsContent value="player" className="mt-4">{grid(players, 'player')}</TabsContent>
        <TabsContent value="story" className="mt-4">{grid(story, 'story')}</TabsContent>
        <TabsContent value="monster" className="mt-4">{grid(monsters, 'monster')}</TabsContent>
        <TabsContent value="table" className="mt-4">
          {onTable.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              Nenhuma ficha na mesa. Abra uma ficha e toque em "Mandar pra mesa".
            </p>
          ) : (
            <div className="space-y-6">
              {onTable.map(s => (
                <div key={s.id} className="space-y-2">
                  <SheetPoster sheet={s} editable onPatch={p => patch(s.id, p)} onRoll={roll => patch(s.id, { last_roll: roll })} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(s.id)}>Editar ficha</Button>
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => {
                      navigator.clipboard.writeText(shareUrl(s.share_id));
                      toast.success('Link copiado!');
                    }}>
                      <Copy className="w-3.5 h-3.5" /> Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cast;
