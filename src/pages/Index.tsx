import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dices, Clock, Swords, Users, Skull, FlaskConical,
  Gamepad2, UserPlus, StickyNote
} from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

const features = [
  { path: '/dados', label: 'Rolagem de Dados', desc: 'D2 ao D1000, dados personalizados e modificadores', icon: Dices },
  { path: '/timer', label: 'Timer do Jogo', desc: 'Controle o tempo no mundo do jogo', icon: Clock },
  { path: '/iniciativa', label: 'Iniciativa', desc: 'Ordem de combate dos personagens', icon: Swords },
  { path: '/jogadores', label: 'Jogadores', desc: 'Fichas completas dos personagens', icon: Users },
  { path: '/monstros', label: 'Monstros', desc: 'Bestiário com stats e ataques', icon: Skull },
  { path: '/pocoes', label: 'Poções', desc: 'Poções com efeitos e rolagens', icon: FlaskConical },
  { path: '/taverna', label: 'Jogos de Taverna', desc: 'Jogos e desafios para diversão', icon: Gamepad2 },
  { path: '/npc', label: 'Gerador de NPC', desc: 'NPCs aleatórios com personalidade', icon: UserPlus },
  { path: '/notas', label: 'Notas', desc: 'Anotações e lembretes da campanha', icon: StickyNote },
];

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden">
        <img src={heroBanner} alt="Arcanum" className="w-full h-48 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex items-end p-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary dice-glow">Arcanum</h1>
            <p className="text-foreground/80 mt-1 text-lg">Ferramentas essenciais para Mestres de RPG</p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <Link key={f.path} to={f.path}>
            <Card className="card-hover h-full group">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{f.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
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
