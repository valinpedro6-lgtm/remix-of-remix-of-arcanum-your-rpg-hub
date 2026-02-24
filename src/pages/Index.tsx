import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dices, Clock, Swords, Users, Skull, FlaskConical,
  Gamepad2, UserPlus, StickyNote, CloudSun, Sword, Sparkles
} from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

const features = [
  { path: '/dados', label: 'Rolagem de Dados', desc: 'D2 ao D1000, dados personalizados e modificadores', icon: Dices, color: 'from-red-500/20 to-orange-500/20' },
  { path: '/timer', label: 'Timer do Jogo', desc: 'Controle o tempo no mundo do jogo', icon: Clock, color: 'from-amber-500/20 to-yellow-500/20' },
  { path: '/iniciativa', label: 'Iniciativa', desc: 'Ordem de combate dos personagens', icon: Swords, color: 'from-red-600/20 to-red-400/20' },
  { path: '/jogadores', label: 'Jogadores', desc: 'Fichas completas dos personagens', icon: Users, color: 'from-blue-500/20 to-cyan-500/20' },
  { path: '/monstros', label: 'Monstros', desc: 'Bestiário com stats e ataques', icon: Skull, color: 'from-purple-500/20 to-pink-500/20' },
  { path: '/pocoes', label: 'Poções', desc: 'Poções com efeitos e rolagens', icon: FlaskConical, color: 'from-green-500/20 to-emerald-500/20' },
  { path: '/taverna', label: 'Jogos de Taverna', desc: 'Jogos e desafios para diversão', icon: Gamepad2, color: 'from-yellow-500/20 to-amber-500/20' },
  { path: '/npc', label: 'Gerador de NPC', desc: 'NPCs aleatórios com personalidade', icon: UserPlus, color: 'from-teal-500/20 to-cyan-500/20' },
  { path: '/ambiente', label: 'Ambiente', desc: 'Sons e clima para imersão', icon: CloudSun, color: 'from-sky-500/20 to-blue-500/20' },
  { path: '/armas', label: 'Armas', desc: 'Arsenal completo com stats', icon: Sword, color: 'from-stone-500/20 to-zinc-500/20' },
  { path: '/notas', label: 'Notas', desc: 'Anotações e lembretes da campanha', icon: StickyNote, color: 'from-orange-500/20 to-amber-500/20' },
];

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden glow-border">
        <img src={heroBanner} alt="Arcanum" className="w-full h-56 md:h-72 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 md:p-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-primary/80 font-semibold">Ferramentas para Mestres</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold gradient-text dice-glow">Arcanum</h1>
            <p className="text-foreground/70 mt-2 text-lg max-w-md">Tudo que você precisa para criar sessões épicas de RPG de mesa.</p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <Link key={f.path} to={f.path} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in">
            <Card className="card-hover h-full group glass-card">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${f.color} text-primary group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">{f.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;
