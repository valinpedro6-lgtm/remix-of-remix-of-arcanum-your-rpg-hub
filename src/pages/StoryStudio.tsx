import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Download, FilePlus2, Flag, Globe2, GripVertical, History,
  MapPin, Package, Plus, Save, Sparkles, Trash2, Users, Wand2, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  createStoryProject, downloadStoryProject, newId,
  type ChapterStatus, type StoryEntity, type StoryProject,
} from '@/lib/storyStudio';

const tabs = [
  { id: 'visao', label: 'Visão geral', icon: Sparkles },
  { id: 'capitulos', label: 'Capítulos', icon: BookOpen },
  { id: 'mundo', label: 'Mundo', icon: Globe2 },
  { id: 'linha-do-tempo', label: 'Linha do tempo', icon: History },
] as const;

type TabId = typeof tabs[number]['id'];
type CollectionKey = 'characters' | 'places' | 'items';

const statusLabel: Record<ChapterStatus, string> = {
  ideia: 'Ideia',
  rascunho: 'Rascunho',
  pronto: 'Pronto',
};

const statusClass: Record<ChapterStatus, string> = {
  ideia: 'bg-secondary text-muted-foreground',
  rascunho: 'bg-primary/15 text-primary',
  pronto: 'bg-emerald-500/15 text-emerald-300',
};

const formatSavedAt = (date: string) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return 'agora';
  return value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const StoryStudio = () => {
  const [project, setProject] = useLocalStorage<StoryProject>('arcanum-story-project', createStoryProject());
  const [activeTab, setActiveTab] = useState<TabId>('visao');
  const [selectedChapterId, setSelectedChapterId] = useState(project.chapters[0]?.id ?? '');
  const [entityDraft, setEntityDraft] = useState({ name: '', role: '', description: '' });
  const [eventDraft, setEventDraft] = useState({ date: '', title: '', description: '' });

  // Remove o conteúdo de exemplo da primeira versão sem apagar uma campanha que o mestre já começou.
  useEffect(() => {
    const firstChapter = project.chapters[0];
    const isUnusedStarter = project.title === 'Minha nova crônica'
      && project.system === 'Sistema próprio'
      && project.premise === 'Uma ideia forte que dá vontade de reunir a mesa.'
      && project.goal === 'O que os personagens precisam conquistar ou impedir?'
      && project.chapters.length === 1
      && firstChapter?.title === 'Prólogo'
      && !firstChapter.content
      && project.characters.length === 0
      && project.places.length === 0;
    if (isUnusedStarter) {
      const emptyProject = createStoryProject();
      setProject(emptyProject);
      setSelectedChapterId(emptyProject.chapters[0].id);
    }
  }, [project, setProject]);

  const selectedChapter = project.chapters.find(chapter => chapter.id === selectedChapterId) ?? project.chapters[0];
  const completion = useMemo(() => {
    const checks = [project.title, project.premise, project.goal, project.chapters.some(chapter => chapter.content.trim()), project.characters.length > 0, project.places.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [project]);

  const updateProject = (patch: Partial<StoryProject>) => {
    setProject(previous => ({ ...previous, ...patch, updatedAt: new Date().toISOString() }));
  };

  const updateChapter = (patch: Partial<NonNullable<typeof selectedChapter>>) => {
    if (!selectedChapter) return;
    updateProject({ chapters: project.chapters.map(chapter => chapter.id === selectedChapter.id ? { ...chapter, ...patch } : chapter) });
  };

  const addChapter = () => {
    const chapter = { id: newId(), title: `Capítulo ${project.chapters.length + 1}`, summary: '', content: '', status: 'ideia' as ChapterStatus };
    updateProject({ chapters: [...project.chapters, chapter] });
    setSelectedChapterId(chapter.id);
    setActiveTab('capitulos');
  };

  const removeChapter = () => {
    if (!selectedChapter || project.chapters.length === 1) return;
    const nextChapters = project.chapters.filter(chapter => chapter.id !== selectedChapter.id);
    updateProject({ chapters: nextChapters });
    setSelectedChapterId(nextChapters[0].id);
  };

  const addEntity = (key: CollectionKey) => {
    if (!entityDraft.name.trim()) return;
    const entity: StoryEntity = { id: newId(), name: entityDraft.name.trim(), role: entityDraft.role.trim(), description: entityDraft.description.trim() };
    updateProject({ [key]: [...project[key], entity] } as Pick<StoryProject, CollectionKey>);
    setEntityDraft({ name: '', role: '', description: '' });
  };

  const removeEntity = (key: CollectionKey, id: string) => {
    updateProject({ [key]: project[key].filter(entity => entity.id !== id) } as Pick<StoryProject, CollectionKey>);
  };

  const addEvent = () => {
    if (!eventDraft.title.trim()) return;
    updateProject({ timeline: [...project.timeline, { id: newId(), ...eventDraft, title: eventDraft.title.trim(), description: eventDraft.description.trim() }] });
    setEventDraft({ date: '', title: '', description: '' });
  };

  const removeEvent = (id: string) => updateProject({ timeline: project.timeline.filter(event => event.id !== id) });

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary"><Wand2 className="h-4 w-4" /> Estúdio de História</div>
          <div className="flex flex-wrap items-center gap-3">
            <Input value={project.title} onChange={event => updateProject({ title: event.target.value })} className="h-auto min-w-[16rem] max-w-full border-0 bg-transparent p-0 font-display text-3xl font-black tracking-wide shadow-none focus-visible:ring-0 md:text-5xl" aria-label="Nome da campanha" />
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary"><Save className="h-3 w-3" /> Salvo às {formatSavedAt(project.updatedAt)}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Tire a ideia da cabeça e monte uma campanha jogável: trama, cenas, personagens e pistas em um só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11 gap-2" onClick={() => downloadStoryProject(project)}><Download className="h-4 w-4" /> Exportar projeto</Button>
          <Button className="min-h-11 gap-2" onClick={addChapter}><FilePlus2 className="h-4 w-4" /> Novo capítulo</Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Progresso', value: `${completion}%`, icon: Flag },
          { label: 'Capítulos', value: project.chapters.length, icon: BookOpen },
          { label: 'Personagens', value: project.characters.length, icon: Users },
          { label: 'Locais', value: project.places.length, icon: MapPin },
        ].map(stat => (
          <Card key={stat.label} className="border-border/40 bg-card/50"><CardContent className="flex items-center gap-3 p-3 sm:p-4"><stat.icon className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-display text-xl font-bold text-primary">{stat.value}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto border-b border-border/50 px-1 pb-2">
        {tabs.map(tab => <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} className={`min-h-11 shrink-0 gap-2 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab(tab.id)}><tab.icon className="h-4 w-4" /> {tab.label}</Button>)}
      </div>

      {activeTab === 'visao' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> A bússola da história</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">Sistema<input value={project.system} onChange={event => updateProject({ system: event.target.value })} className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="D&D, Tormenta, próprio..." /></label>
              <label className="space-y-2 text-sm font-semibold">Gênero<input value={project.genre} onChange={event => updateProject({ genre: event.target.value })} className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Fantasia, horror..." /></label>
              <label className="space-y-2 text-sm font-semibold sm:col-span-2">Tom da mesa<input value={project.tone} onChange={event => updateProject({ tone: event.target.value })} className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Épico, sombrio, leve..." /></label>
              <label className="space-y-2 text-sm font-semibold sm:col-span-2">Premissa<textarea value={project.premise} onChange={event => updateProject({ premise: event.target.value })} className="mt-1 min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm font-normal leading-relaxed outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Em uma frase, o que torna esta história especial?" /></label>
              <label className="space-y-2 text-sm font-semibold sm:col-span-2">Objetivo da campanha<textarea value={project.goal} onChange={event => updateProject({ goal: event.target.value })} className="mt-1 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm font-normal leading-relaxed outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Qual é a grande pergunta que a mesa vai responder?" /></label>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card/70 to-card/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Próximo passo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">Comece pelo conflito. Uma boa primeira cena dá aos jogadores uma decisão clara, uma ameaça próxima e um motivo para agir agora.</p>
              <div className="rounded-xl border border-border/40 bg-background/30 p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Checklist rápido</p><div className="mt-3 space-y-3">{[['Premissa definida', Boolean(project.premise.trim())], ['Primeiro capítulo criado', project.chapters.length > 0], ['Um personagem central', project.characters.length > 0], ['Um lugar memorável', project.places.length > 0]].map(([label, done]) => <div key={String(label)} className="flex items-center gap-2 text-sm"><span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-secondary text-muted-foreground'}`}>{done ? '✓' : '·'}</span>{String(label)}</div>)}</div></div>
              <Button variant="outline" className="min-h-11 w-full" onClick={() => setActiveTab('capitulos')}>Escrever a primeira cena <BookOpen className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'capitulos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Card className="h-fit border-border/40 bg-card/50">
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Capítulos</CardTitle><Button variant="ghost" size="icon" onClick={addChapter} aria-label="Adicionar capítulo"><Plus className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-2">
              {project.chapters.map((chapter, index) => <button key={chapter.id} onClick={() => setSelectedChapterId(chapter.id)} className={`group flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedChapter?.id === chapter.id ? 'border-primary/40 bg-primary/10' : 'border-border/30 bg-background/20 hover:bg-secondary/50'}`}><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" /><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{chapter.title || 'Sem título'}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] ${statusClass[chapter.status]}`}>{statusLabel[chapter.status]}</span></span></button>)}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">Capítulo em foco</div><Input value={selectedChapter?.title ?? ''} onChange={event => updateChapter({ title: event.target.value })} className="h-auto border-0 bg-transparent p-0 font-display text-2xl font-bold shadow-none focus-visible:ring-0 md:text-3xl" placeholder="Nome do capítulo" /></div><div className="flex shrink-0 gap-2"><select value={selectedChapter?.status ?? 'ideia'} onChange={event => updateChapter({ status: event.target.value as ChapterStatus })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="ideia">Ideia</option><option value="rascunho">Rascunho</option><option value="pronto">Pronto</option></select><Button variant="ghost" size="icon" onClick={removeChapter} disabled={project.chapters.length === 1} aria-label="Excluir capítulo"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader>
            <CardContent className="space-y-4"><label className="block space-y-2 text-sm font-semibold">Resumo da cena<Textarea value={selectedChapter?.summary ?? ''} onChange={event => updateChapter({ summary: event.target.value })} placeholder="O que acontece neste capítulo?" className="min-h-24 font-normal" /></label><label className="block space-y-2 text-sm font-semibold">Texto da história<Textarea value={selectedChapter?.content ?? ''} onChange={event => updateChapter({ content: event.target.value })} placeholder="Escreva aqui a cena, a descrição para ler em voz alta ou as notas secretas do mestre..." className="min-h-[22rem] resize-y font-normal leading-relaxed" /></label><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{selectedChapter?.content.length ?? 0} caracteres</span><span>As alterações são salvas automaticamente neste aparelho.</span></div></CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'mundo' && <WorldBuilder project={project} entityDraft={entityDraft} setEntityDraft={setEntityDraft} addEntity={addEntity} removeEntity={removeEntity} />}

      {activeTab === 'linha-do-tempo' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="h-fit border-border/40 bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo evento</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={eventDraft.date} onChange={event => setEventDraft({ ...eventDraft, date: event.target.value })} placeholder="Quando? Ex.: Dia 1, inverno" /><Input value={eventDraft.title} onChange={event => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="Título do evento" /><Textarea value={eventDraft.description} onChange={event => setEventDraft({ ...eventDraft, description: event.target.value })} placeholder="O que muda depois deste acontecimento?" /><Button className="min-h-11 w-full" onClick={addEvent} disabled={!eventDraft.title.trim()}>Adicionar à linha do tempo <Plus className="h-4 w-4" /></Button></CardContent></Card>
          <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Linha do tempo da campanha</CardTitle></CardHeader><CardContent>{project.timeline.length === 0 ? <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">Ainda não há eventos. Registre o passado do mundo ou os marcos que a mesa precisa alcançar.</div> : <div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-primary/30">{project.timeline.map(event => <div key={event.id} className="relative rounded-xl border border-border/40 bg-background/25 p-4"><span className="absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full border-2 border-background bg-primary" /><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest text-primary">{event.date || 'Sem data'}</p><h3 className="mt-1 font-display text-lg font-bold">{event.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description || 'Sem descrição'}</p></div><Button variant="ghost" size="icon" onClick={() => removeEvent(event.id)} aria-label={`Excluir ${event.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>}</CardContent></Card>
        </motion.div>
      )}
    </div>
  );
};

interface WorldBuilderProps {
  project: StoryProject;
  entityDraft: { name: string; role: string; description: string };
  setEntityDraft: (value: { name: string; role: string; description: string }) => void;
  addEntity: (key: CollectionKey) => void;
  removeEntity: (key: CollectionKey, id: string) => void;
}

const WorldBuilder = ({ project, entityDraft, setEntityDraft, addEntity, removeEntity }: WorldBuilderProps) => {
  const collections: { key: CollectionKey; label: string; icon: typeof Users; helper: string }[] = [
    { key: 'characters', label: 'Personagens', icon: Users, helper: 'Heróis, rivais, aliados e figuras importantes.' },
    { key: 'places', label: 'Locais', icon: MapPin, helper: 'Cidades, masmorras, reinos e pontos de interesse.' },
    { key: 'items', label: 'Itens e pistas', icon: Package, helper: 'Relíquias, documentos, armas e segredos.' },
  ];
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><Card className="border-primary/20 bg-primary/5"><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end"><label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome<Input value={entityDraft.name} onChange={event => setEntityDraft({ ...entityDraft, name: event.target.value })} className="mt-1 h-11 text-sm normal-case tracking-normal" placeholder="Ex.: Seraphina" /></label><label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Função<Input value={entityDraft.role} onChange={event => setEntityDraft({ ...entityDraft, role: event.target.value })} className="mt-1 h-11 text-sm normal-case tracking-normal" placeholder="Ex.: antagonista" /></label><label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição rápida<Input value={entityDraft.description} onChange={event => setEntityDraft({ ...entityDraft, description: event.target.value })} className="mt-1 h-11 text-sm normal-case tracking-normal" placeholder="O detalhe que a mesa precisa lembrar" /></label><div className="flex gap-2 sm:col-span-4 sm:justify-end"><Button variant="secondary" className="min-h-11" onClick={() => addEntity('characters')} disabled={!entityDraft.name.trim()}><Users className="h-4 w-4" /> Personagem</Button><Button variant="secondary" className="min-h-11" onClick={() => addEntity('places')} disabled={!entityDraft.name.trim()}><MapPin className="h-4 w-4" /> Local</Button><Button variant="secondary" className="min-h-11" onClick={() => addEntity('items')} disabled={!entityDraft.name.trim()}><Package className="h-4 w-4" /> Item</Button></div></CardContent></Card><div className="grid gap-4 lg:grid-cols-3">{collections.map(collection => <Card key={collection.key} className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><collection.icon className="h-5 w-5 text-primary" /> {collection.label}</CardTitle><p className="text-xs font-normal text-muted-foreground">{collection.helper}</p></CardHeader><CardContent className="space-y-2">{project[collection.key].length === 0 ? <p className="rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">Nenhum registro ainda.</p> : project[collection.key].map(entity => <div key={entity.id} className="group rounded-xl border border-border/40 bg-background/25 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{entity.name}</p>{entity.role && <Badge variant="outline" className="mt-1 text-[10px]">{entity.role}</Badge>}</div><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100" onClick={() => removeEntity(collection.key, entity.id)} aria-label={`Excluir ${entity.name}`}><X className="h-4 w-4 text-destructive" /></Button></div>{entity.description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entity.description}</p>}</div>)}</CardContent></Card>)}</div></motion.div>;
};

export default StoryStudio;
