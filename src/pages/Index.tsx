import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dices, Clock, Swords, Users, Skull, FlaskConical,
  Gamepad2, UserPlus, StickyNote, CloudSun, Sword, Sparkles, Coins, Gauge
} from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const features = [
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
        className="relative rounded-2xl overflow-hidden glow-border"
      >
        <img
          src={heroBanner}
          alt="Arcanum — Ferramentas para Mestres de RPG"
          className="w-full h-60 md:h-80 object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-primary/60" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary/80 font-semibold">Ferramentas para Mestres</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-5xl md:text-7xl font-display font-bold gradient-text dice-glow tracking-wide">
              Arcanum
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-foreground/70 mt-3 text-lg max-w-lg leading-relaxed">
              Tudo que você precisa para criar sessões épicas de RPG de mesa.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="flex flex-wrap gap-2 mt-5">
              <Button asChild className="gap-2 shadow-lg shadow-primary/20"><Link to="/painel"><Gauge className="w-4 h-4" />Abrir o painel</Link></Button>
              <Button asChild variant="outline" className="gap-2 bg-background/35"><Link to="/mesa"><Dices className="w-4 h-4" />Começar uma sessão</Link></Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="flex items-end justify-between gap-4">
        <div><p className="section-kicker">Seu arsenal de mesa</p><h2 className="font-display text-xl md:text-2xl font-bold mt-1">Tudo no alcance de um d20</h2></div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/.8)]" />Pronto para jogar</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04, duration: 0.4 }}
          >
            <Link to={f.path}>
              <Card className="card-hover h-full group border-border/45 bg-card/75 overflow-hidden relative">
                <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${f.accent} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="p-4 md:p-5 relative">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 w-fit mb-3">
                    <f.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="font-display text-sm md:text-base font-semibold group-hover:text-primary transition-colors leading-tight">{f.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed hidden sm:block">{f.desc}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Index;
