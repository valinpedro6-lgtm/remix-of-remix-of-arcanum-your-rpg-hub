import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Clock3, Compass, Copy, Crown, Dices, Eye, Flame, Lightbulb, LockKeyhole, MapPin, RefreshCw, ScrollText, Sparkles, Swords, Target, Users, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Brief = {
  genre: string;
  tone: string;
  scale: string;
  protagonists: string;
  location: string;
  theme: string;
  engine: string;
  twist: string;
  system: string;
  seed: string;
  avoid: string;
};

type StoryIdea = {
  title: string;
  hook: string;
  premise: string;
  identity: string;
  antagonist: string;
  secret: string;
  opening: string;
  progression: string[];
  twists: string[];
  table: string[];
};

const initialBrief: Brief = { genre: 'fantasia-sombria', tone: 'paranoico', scale: 'campanha', protagonists: 'outsiders', location: 'cidade-impossivel', theme: 'memoria', engine: 'relogio', twist: 'verdade', system: 'Sistema próprio', seed: '', avoid: '' };

const questionData = [
  { key: 'genre', label: 'Que tipo de história vai ferver a mesa?', icon: Flame, options: [['fantasia-sombria', 'Fantasia sombria'], ['horror-cosmico', 'Horror cósmico'], ['crime-urbano', 'Crime urbano'], ['ficcao-cientifica', 'Ficção científica'], ['folclore', 'Folclore brasileiro'], ['aventura-pulp', 'Aventura pulp']] },
  { key: 'tone', label: 'Qual sabor emocional?', icon: Eye, options: [['paranoico', 'Paranoico'], ['tragico', 'Trágico'], ['eletrico', 'Elétrico e divertido'], ['claustrofobico', 'Claustrofóbico'], ['melancolico', 'Melancólico'], ['surreal', 'Surreal']] },
  { key: 'scale', label: 'Quanto tempo essa ideia precisa respirar?', icon: Clock3, options: [['one-shot', 'One-shot'], ['mini', 'Mini-campanha (4–6 sessões)'], ['campanha', 'Campanha longa'], ['arco', 'Arco dentro de uma campanha']] },
  { key: 'protagonists', label: 'Quem os jogadores interpretam?', icon: Users, options: [['outsiders', 'Forasteiros com algo a provar'], ['especialistas', 'Especialistas convocados para um impossível'], ['condenados', 'Pessoas condenadas tentando sobreviver'], ['herdeiros', 'Herdeiros de um legado perigoso'], ['monstros', 'Monstros fingindo ser gente'], ['comunidade', 'Uma comunidade inteira sob pressão']] },
  { key: 'location', label: 'Onde a história fica impossível de ignorar?', icon: MapPin, options: [['cidade-impossivel', 'Uma cidade que não deveria existir'], ['interior', 'Uma cidade pequena com um pacto antigo'], ['navio', 'Um navio, trem ou estação sem destino'], ['fronteira', 'Uma fronteira em guerra'], ['subterraneo', 'Algo enterrado sob a civilização'], ['futuro', 'Uma colônia no fim do mundo']] },
  { key: 'theme', label: 'Sobre o que a história é de verdade?', icon: Brain, options: [['memoria', 'Memória e identidade'], ['culpa', 'Culpa e reparação'], ['liberdade', 'Liberdade contra controle'], ['fe', 'Fé, legado e heresia'], ['classe', 'Poder, classe e exploração'], ['natureza', 'Natureza cobrando a dívida']] },
  { key: 'engine', label: 'O que mantém a tensão acesa?', icon: Target, options: [['relogio', 'Um relógio correndo'], ['cacada', 'Alguém está caçando o grupo'], ['cerco', 'O lugar está sendo cercado'], ['divida', 'Cada solução cobra um preço'], ['ritual', 'Um ritual já começou'], ['colapso', 'O mundo está mudando em tempo real']] },
  { key: 'twist', label: 'Que tipo de virada você quer guardar?', icon: LockKeyhole, options: [['verdade', 'A verdade muda o sentido de tudo'], ['aliado', 'O aliado mais confiável tem outro plano'], ['identidade', 'Os heróis são parte do problema'], ['mundo', 'O cenário não é o que parece'], ['vitoria', 'Vencer pode ser pior que perder'], ['escolha', 'Não existe final limpo']] },
] as const;

const pick = (items: string[], index: number) => items[index % items.length];

const buildIdea = (brief: Brief, generation: number): StoryIdea => {
  const suffix = generation % 2 === 0 ? 'da Última Luz' : 'que o Mundo Esqueceu';
  const titles: Record<string, string[]> = {
    'fantasia-sombria': ['O Sino Sob a Pele', 'A Corte dos Nomes Mortos', 'A Cidade que Sangra Devagar'],
    'horror-cosmico': ['O Mar Debaixo da Cidade', 'A Frequência das Estrelas', 'O Deus que Aprendeu a Sussurrar'],
    'crime-urbano': ['Sete Minutos para o Álibi', 'A Cidade Não Dorme, Ela Observa', 'O Arquivo dos Desaparecidos'],
    'ficcao-cientifica': ['Órbita de Cinzas', 'A Colônia que Sonhava Acordada', 'Protocolo: Ninguém Volta'],
    'folclore': ['A Boca da Mata', 'O Cortejo das Águas Fundas', 'Quando o Saci Parou de Rir'],
    'aventura-pulp': ['O Mapa que Morde', 'Expresso para Lugar Nenhum', 'A Relíquia do Céu Partido'],
  };
  const location = {
    'cidade-impossivel': 'uma cidade que aparece em mapas diferentes a cada madrugada', interior: 'uma cidade pequena onde todos lembram de um crime que nunca aconteceu', navio: 'um transporte preso em um trajeto que não termina', fronteira: 'uma fronteira onde os mortos continuam recebendo ordens', subterraneo: 'uma camada esquecida sob as ruas, ainda perfeitamente habitada', futuro: 'uma colônia que recebe mensagens do próprio futuro',
  }[brief.location];
  const protagonist = {
    outsiders: 'forasteiros que chegaram juntos por motivos diferentes e não podem confiar uns nos outros', especialistas: 'especialistas em coisas que ninguém deveria ter estudado', condenados: 'pessoas marcadas para morrer que descobrem que a sentença era parte de um plano', herdeiros: 'herdeiros de uma promessa que seus antepassados quebraram', monstros: 'criaturas que aprenderam a imitar humanos, mas esqueceram por quê', comunidade: 'uma comunidade inteira que precisa escolher quem será sacrificado',
  }[brief.protagonists];
  const theme = { memoria: 'memória e identidade', culpa: 'culpa e reparação', liberdade: 'liberdade contra controle', fe: 'fé, legado e heresia', classe: 'poder e exploração', natureza: 'a dívida que a civilização tem com a natureza' }[brief.theme];
  const engine = { relogio: 'a cada sessão, uma regra do mundo deixa de funcionar', cacada: 'um inimigo sabe detalhes de cada personagem que ninguém contou', cerco: 'as rotas de saída desaparecem uma por uma', divida: 'toda ajuda recebida cria uma dívida que será cobrada em cena', ritual: 'um ritual avança mesmo quando ninguém o alimenta', colapso: 'o cenário se reescreve em tempo real e só os personagens percebem' }[brief.engine];
  const twist = { verdade: 'a verdade revela que o desastre já aconteceu; a campanha é uma tentativa de lembrar o que foi apagado', aliado: 'a pessoa que guia o grupo está tentando salvar o mundo errado', identidade: 'os personagens não foram escolhidos para impedir o horror, mas para dar a ele uma forma', mundo: 'o lugar é uma máquina viva que usa histórias humanas como combustível', vitoria: 'a vitória pedida pelos aliados é exatamente o mecanismo que mantém o problema vivo', escolha: 'o final exige escolher qual parte da verdade será sacrificada' }[brief.twist];
  const seed = brief.seed.trim() ? ` O detalhe obrigatório do mestre — “${brief.seed.trim()}” — vira a imagem que todos reconhecerão quando a mentira começar a ruir.` : '';
  const avoid = brief.avoid.trim() ? ` Evite: ${brief.avoid.trim()}.` : '';
  const title = `${pick(titles[brief.genre] ?? titles['fantasia-sombria'], generation)} ${suffix}`;
  return {
    title,
    hook: `Na primeira cena, ${protagonist} recebe uma prova impossível: ${location} acaba de enviar uma mensagem assinada por alguém que morreu há anos.`,
    premise: `${protagonist} precisa atravessar ${location} enquanto ${engine}. A aventura parece ser sobre sobreviver, mas é sobre ${theme}.${seed}${avoid}`,
    identity: `A assinatura desta campanha é transformar ${theme} em uma ameaça jogável: cada pista muda não só o que os personagens sabem, mas quem eles podem ser diante da mesa.`,
    antagonist: `A oposição não é apenas uma pessoa: é uma instituição que lucra com o esquecimento, liderada por alguém que acredita estar protegendo o mundo da verdade.`,
    secret: `O primeiro segredo que o mestre sabe: ${twist}.`,
    opening: `Cena de abertura: os personagens estão em um lugar público quando todos os relógios marcam a mesma hora. Uma pessoa desconhecida entrega a cada um um objeto que só poderia existir depois de sua própria morte. Então a cidade inteira esquece seus nomes por um minuto.`,
    progression: [
      'Sessão 1 — O impossível tem testemunhas: apresentar a mensagem, o primeiro preço e uma escolha que não pode ser desfeita.',
      'Sessões 2–3 — A versão oficial: seguir três pistas incompatíveis e descobrir que cada facção está contando uma parte verdadeira.',
      'Sessões 4–5 — O lugar por trás do lugar: entrar na origem do fenômeno e decidir quem merece lembrar.',
      'Final — A verdade cobra presença: os personagens precisam escolher o que salvar, o que apagar e quem terá de carregar a memória sozinho.',
    ],
    twists: [
      'Uma pista importante é verdadeira, mas foi deixada pelo futuro.',
      'Um aliado recorrente tem memórias diferentes da mesma conversa.',
      `A virada principal: ${twist}.`,
    ],
    table: ['O que seu personagem prefere esquecer?', 'Que mentira você contaria para proteger alguém?', 'O que faria você acreditar em uma pessoa que não lembra de você?'],
  };
};

const StoryIdeaGenerator = () => {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [idea, setIdea] = useState<StoryIdea | null>(null);
  const [generation, setGeneration] = useState(0);

  const update = <K extends keyof Brief>(key: K, value: Brief[K]) => setBrief(current => ({ ...current, [key]: value }));
  const generate = () => { const next = generation + 1; setGeneration(next); setIdea(buildIdea(brief, next)); };
  const copyIdea = async () => { if (idea) await navigator.clipboard?.writeText([idea.title, idea.hook, idea.premise, idea.secret, ...idea.progression].join('\n\n')); };

  const answered = questionData.filter(question => Boolean(brief[question.key])).length;

  return <div className="mx-auto max-w-[1800px] space-y-6">
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/20 via-card/75 to-card/30 shadow-[0_0_50px_hsl(var(--primary)/0.08)]"><CardContent className="p-5 md:p-8 xl:p-10"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-4xl"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="gap-2 bg-primary/15 text-primary hover:bg-primary/20"><Sparkles className="h-3.5 w-3.5" /> Diretor criativo de campanhas</Badge><Badge variant="outline" className="border-border/60 text-muted-foreground">{answered}/8 decisões fechadas</Badge></div><h2 className="font-display text-3xl font-black tracking-wide md:text-5xl xl:text-6xl">Ideias que chegam com dentes.</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base xl:text-lg">Antes de criar, o mestre faz perguntas. O resultado não é uma sinopse genérica: é um motor de campanha com identidade, conflito, preço, viradas e uma primeira cena pronta para colocar na mesa.</p></div><Button onClick={generate} size="lg" className="min-h-12 gap-2 self-stretch lg:self-auto xl:px-7"><Dices className="h-5 w-5" /> Gerar ideia impossível</Button></div></CardContent></Card>

    <div className="grid gap-6 xl:grid-cols-[minmax(23rem,28rem)_minmax(0,1fr)] xl:items-start">
      <Card className="glass-card xl:sticky xl:top-5 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto"><CardHeader className="border-b border-border/40 bg-background/20 xl:sticky xl:top-0 xl:z-10"><CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5 text-primary" /> O briefing do mestre</CardTitle><p className="text-sm font-normal text-muted-foreground">Escolha o DNA. Quanto mais específico, mais singular será a proposta.</p></CardHeader><CardContent className="space-y-5 p-4 md:p-6">
        {questionData.map(question => <div key={question.key} className="space-y-2"><div className="flex items-center gap-2 text-sm font-semibold"><question.icon className="h-4 w-4 text-primary" /> {question.label}</div><div className="grid grid-cols-2 gap-2 2xl:grid-cols-3">{question.options.map(([value, label]) => <button key={value} type="button" onClick={() => update(question.key, value)} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs transition-all ${brief[question.key] === value ? 'border-primary bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.14)]' : 'border-border/50 bg-background/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>{label}</button>)}</div></div>)}
        <div className="grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold sm:col-span-2">Sistema ou referência<Input value={brief.system} onChange={event => update('system', event.target.value)} className="mt-1 h-11" placeholder="D&D, Ordem Paranormal, sistema próprio..." /></label><label className="space-y-2 text-sm font-semibold">Imagem obrigatória<Textarea value={brief.seed} onChange={event => update('seed', event.target.value)} className="mt-1 min-h-20" placeholder="Ex.: uma noiva sem rosto, um rádio de pilha..." /></label><label className="space-y-2 text-sm font-semibold">O que não pode aparecer?<Textarea value={brief.avoid} onChange={event => update('avoid', event.target.value)} className="mt-1 min-h-20" placeholder="Ex.: chosen one, reino medieval genérico..." /></label></div>
        <Button onClick={generate} className="min-h-12 w-full gap-2 xl:sticky xl:bottom-0 xl:shadow-[0_-12px_24px_hsl(var(--card)/0.9)]"><Wand2 className="h-4 w-4" /> Fechar briefing e criar</Button>
      </CardContent></Card>

      {!idea ? <Card className="grid min-h-[30rem] place-items-center border-dashed border-border/60 bg-card/30 xl:min-h-[calc(100vh-14rem)]"><CardContent className="max-w-lg text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Lightbulb className="h-8 w-8" /></div><h3 className="font-display text-2xl font-bold xl:text-3xl">A ideia ainda está no escuro.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Responda o briefing ao lado e gere uma proposta com abertura, antagonista, segredo, progressão e perguntas para os jogadores.</p></CardContent></Card> : <motion.div key={idea.title + generation} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5"><Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/40 shadow-[0_0_45px_hsl(var(--primary)/0.08)]"><CardHeader className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="outline" className="mb-2 border-primary/40 text-primary">{brief.system || 'Sistema próprio'} · {brief.scale}</Badge><CardTitle className="font-display text-3xl leading-tight md:text-5xl">{idea.title}</CardTitle></div><div className="flex gap-2"><Button variant="outline" size="icon" onClick={copyIdea} aria-label="Copiar ideia"><Copy className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={generate} aria-label="Gerar outra ideia"><RefreshCw className="h-4 w-4" /></Button></div></div></CardHeader><CardContent className="space-y-5 p-5 md:p-7"><div className="rounded-xl border border-primary/25 bg-background/25 p-5"><p className="text-xs font-bold uppercase tracking-widest text-primary">O gancho</p><p className="mt-2 text-base font-semibold leading-relaxed md:text-lg">{idea.hook}</p></div><section><h3 className="flex items-center gap-2 font-display text-xl font-bold"><ScrollText className="h-4 w-4 text-primary" /> Premissa jogável</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{idea.premise}</p></section><section className="grid gap-4 2xl:grid-cols-2"><div className="rounded-xl border border-border/40 bg-background/20 p-5"><p className="text-xs uppercase tracking-widest text-primary">Identidade</p><p className="mt-2 text-sm leading-relaxed">{idea.identity}</p></div><div className="rounded-xl border border-border/40 bg-background/20 p-5"><p className="text-xs uppercase tracking-widest text-primary">Antagonismo</p><p className="mt-2 text-sm leading-relaxed">{idea.antagonist}</p></div></section><section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5"><p className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300"><LockKeyhole className="h-4 w-4" /> Segredo do mestre</p><p className="mt-2 text-sm leading-relaxed">{idea.secret}</p></section></CardContent></Card><Card className="glass-card"><CardHeader className="p-5 md:p-7"><CardTitle className="flex items-center gap-2 text-xl"><BookOpen className="h-5 w-5 text-primary" /> Como essa campanha respira</CardTitle></CardHeader><CardContent className="space-y-5 p-5 md:p-7"><div className="rounded-xl border border-border/40 bg-background/20 p-5"><p className="text-xs uppercase tracking-widest text-primary">Primeira cena</p><p className="mt-2 text-sm leading-relaxed md:text-base">{idea.opening}</p></div><div className="grid gap-3">{idea.progression.map((step, index) => <div key={step} className="flex gap-3 rounded-xl border border-border/40 bg-background/20 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{index + 1}</span><p className="text-sm leading-relaxed">{step}</p></div>)}</div><div className="grid gap-5 2xl:grid-cols-2"><div><h3 className="mb-2 flex items-center gap-2 font-display font-bold"><Swords className="h-4 w-4 text-primary" /> Três facas escondidas</h3><ul className="space-y-2 text-sm text-muted-foreground">{idea.twists.map(twist => <li key={twist} className="border-l-2 border-primary/40 pl-3 leading-relaxed">{twist}</li>)}</ul></div><div><h3 className="mb-2 flex items-center gap-2 font-display font-bold"><Users className="h-4 w-4 text-primary" /> Perguntas para a mesa</h3><ul className="space-y-2 text-sm text-muted-foreground">{idea.table.map(question => <li key={question} className="border-l-2 border-amber-500/40 pl-3 leading-relaxed">{question}</li>)}</ul></div></div></CardContent></Card></motion.div>}
    </div>
  </div>;
};

export default StoryIdeaGenerator;
