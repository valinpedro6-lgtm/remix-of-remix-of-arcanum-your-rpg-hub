import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dices, Clock, Swords, Users, Skull, FlaskConical,
  Gamepad2, UserPlus, StickyNote, CloudSun, Sword, Sparkles, Coins, Gauge, ArrowRight, Drama, ScrollText
} from 'lucide-react';
import heroBanner from '@/assets/hero-banner-v2.jpg';
import { motion } from 'framer-motion';

const features = [
  { path: '/historias', label: 'Estúdio de História', desc: 'Crie campanhas por capítulos', icon: ScrollText, accent: 'from-primary/25 to-amber-500/10' },
  { path: '/painel', label: 'Painel do Mestre', desc: 'Dashboard com tudo resumido', icon: Gauge, accent: 'from-amber-500/20 to-yellow-500/10' },
  { path: '/mesa?t=dados', label: 'Rolagem de Dados', desc: 'D2 ao D1000 com modificadores', icon: Dices, accent: 'from-red-500/20 to-orange-500/10' },
  { path: '/mesa?t=iniciativa', label: 'Iniciativa', desc: 'Combate com HP e condições', icon: Swords, accent: 'from-red-500/20 to-rose-500/10' },
  { path: '/mesa?t=timer', label: 'Timer do Jogo', desc: 'Controle o tempo no mundo', icon: Clock, accent: 'from-amber-500/20 to-yellow-500/10' },
  { path: '/mesa?t=taverna', label: 'Jogos de Taverna', desc: 'Diversão na taverna', icon: Gamepad2, accent: 'from-yellow-500/20 to-amber-500/10' },
  { path: '/fichas', label: 'Jogadores', desc: 'Fichas completas', icon: Users, accent: 'from-blue-500/20 to-cyan-500/10' },
  { path: '/fichas?t=monstros', label: 'Monstros', desc: 'Bestiário com stats', icon: Skull, accent: 'from-purple-500/20 to-violet-500/10' },
  { path: '/geradores', label: 'Gerador de NPC', desc: 'NPCs com psicologia', icon: UserPlus, accent: 'from-teal-500/20 to-cyan-500/10' },
  { path: '/geradores?t=loot', label: 'Gerador de Loot', desc: 'Tesouros aleatórios por nível', icon: Coins, accent: 'from-yellow-500/20 to-amber-500/10' },
  { path: '/geradores?t=ambiente', label: 'Ambiente', desc: 'Clima e eventos', icon: CloudSun, accent: 'from-sky-500/20 to-blue-500/10' },
  { path: '/compendio', label: 'Grimório', desc: 'Magias com rolagem', icon: Sparkles, accent: 'from-indigo-500/20 to-blue-500/10' },
  { path: '/compendio?t=armas', label: 'Armas', desc: 'Arsenal completo', icon: Sword, accent: 'from-orange-500/20 to-red-500/10' },
  { path: '/compendio?t=pocoes', label: 'Poções', desc: 'Efeitos e rolagens', icon: FlaskConical, accent: 'from-emerald-500/20 to-green-500/10' },
  { path: '/notas', label: 'Notas', desc: 'Anotações da campanha', icon: StickyNote, accent: 'from-pink-500/20 to-rose-500/10' },
];


const Index = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden border border-primary/30 shadow-[0_0_70px_hsl(var(--primary)/0.16)] group"
      >
        <img
          src={heroBanner}
          alt="Dragão ancestral sobre ruínas vulcânicas — Arcanum"
          className="w-full h-[21rem] md:h-[32rem] object-cover object-center transition-transform duration-1000 group-hover:scale-[1.025]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,hsl(var(--primary)/0.16),transparent_35%)] mix-blend-screen" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
        <div className="absolute inset-0 flex items-end p-6 md:p-12">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mb-3">
              <div className="h-px w-12 bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              <span className="text-[11px] uppercase tracking-[0.28em] text-primary font-bold">O grimório digital do mestre</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-6xl md:text-8xl font-display font-black gradient-text dice-glow tracking-[0.08em] leading-none">
              Arcanum
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-foreground/80 mt-4 text-base md:text-xl max-w-lg leading-relaxed drop-shadow-lg">
              Transforme ideias em mundos vivos. Fichas, elenco, geradores e mesa em um só lugar.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="flex flex-wrap gap-3 mt-6">
              <Link to="/historias" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.35)] transition-transform hover:scale-105">
                <ScrollText className="h-4 w-4" /> Criar uma história <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/elenco" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-primary hover:text-primary">
                <Drama className="h-4 w-4" /> Abrir elenco
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <section className="space-y-4">
        <div className="section-heading"><div><p className="eyebrow">Comece por aqui</p><h2 className="section-title">Comando da campanha</h2></div><span className="section-rule" /></div>
        <div className="grid gap-3 md:grid-cols-3">
          {features.slice(0, 3).map((f, i) => (
            <motion.div key={f.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <Link to={f.path} className="action-card group block h-full">
                <div className={`action-card-glow bg-gradient-to-br ${f.accent}`} />
                <div className="relative flex items-start gap-4 p-5"><div className="action-icon"><f.icon className="h-5 w-5" /></div><div className="min-w-0"><h3 className="font-display text-base font-bold transition-colors group-hover:text-primary">{f.label}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p></div><ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="section-heading"><div><p className="eyebrow">Ferramentas</p><h2 className="section-title">Acesso rápido</h2></div><span className="section-rule" /></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {features.slice(3).map(f => <Link key={f.path} to={f.path} className="tool-row group"><span className="tool-row-icon"><f.icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold group-hover:text-primary">{f.label}</span><span className="block truncate text-[11px] text-muted-foreground">{f.desc}</span></span><ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-primary" /></Link>)}
        </div>
      </section>
    </div>
  );
};

export default Index;
