import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Dices, Clock, Swords, Users, Skull, FlaskConical,
  Gamepad2, UserPlus, StickyNote, LayoutDashboard, Menu, CloudSun, Sword, Sparkles, Coins, Gauge
} from 'lucide-react';
import { GlobalTimerBar } from '@/components/GlobalTimerBar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/painel', label: 'Painel', icon: Gauge },
  { path: '/dados', label: 'Dados', icon: Dices },
  { path: '/timer', label: 'Timer', icon: Clock },
  { path: '/iniciativa', label: 'Iniciativa', icon: Swords },
  { path: '/jogadores', label: 'Jogadores', icon: Users },
  { path: '/monstros', label: 'Monstros', icon: Skull },
  { path: '/pocoes', label: 'Poções', icon: FlaskConical },
  { path: '/taverna', label: 'Taverna', icon: Gamepad2 },
  { path: '/npc', label: 'NPC', icon: UserPlus },
  { path: '/ambiente', label: 'Ambiente', icon: CloudSun },
  { path: '/armas', label: 'Armas', icon: Sword },
  { path: '/magias', label: 'Magias', icon: Sparkles },
  { path: '/loot', label: 'Loot', icon: Coins },
  { path: '/notas', label: 'Notas', icon: StickyNote },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200 ${
              isActive
                ? 'bg-primary/15 text-primary font-semibold shadow-[inset_0_0_20px_hsl(0_75%_50%_/_0.08)]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1'
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} />
            <span>{item.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm fixed h-full z-40">
        <div className="p-5 border-b border-border/50">
          <h1 className="text-2xl font-display font-bold gradient-text tracking-wide">Arcanum</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ferramentas para Mestres</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-border/50 space-y-2">
          <ThemeSwitcher />
          <GlobalTimerBar />
          <div className="text-[10px] text-muted-foreground/50 text-center">⚔️ Arcanum v2.0</div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card/95 backdrop-blur-lg border-border/50 flex flex-col h-full">
            <div className="p-5 border-b border-border/50">
              <h1 className="text-2xl font-display font-bold gradient-text">Arcanum</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Ferramentas para Mestres</p>
            </div>
            <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="p-3 border-t border-border/50">
              <ThemeSwitcher />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-display font-bold gradient-text">Arcanum</h1>
        <div className="ml-auto">
          <GlobalTimerBar />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 p-4 md:p-6 pt-16 md:pt-6 min-h-screen subtle-pattern">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
