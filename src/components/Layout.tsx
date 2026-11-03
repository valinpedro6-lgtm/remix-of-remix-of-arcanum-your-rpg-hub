import { ReactNode, useEffect, useState } from 'react';
import { isMaster, logout } from '@/lib/access';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Users, StickyNote, LayoutDashboard, Menu, Gauge, Dices, Wand2, BookOpen, Network
, Drama, Map as MapIcon, Shield, LogOut } from 'lucide-react';
import { GlobalTimerBar } from '@/components/GlobalTimerBar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/painel', label: 'Painel', icon: Gauge },
  { path: '/mesa', label: 'Mesa', icon: Dices },
  { path: '/elenco', label: 'Elenco', icon: Drama },
  { path: '/tabletop', label: 'Tabletop', icon: MapIcon },
  { path: '/fichas', label: 'Fichas', icon: Users },
  { path: '/geradores', label: 'Geradores', icon: Wand2 },
  { path: '/compendio', label: 'Compêndio', icon: BookOpen },
  { path: '/mapa', label: 'Mapa Mental', icon: Network },
  { path: '/notas', label: 'Notas', icon: StickyNote },
];


export const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [master, setMaster] = useState(isMaster);
  useEffect(() => {
    const h = () => setMaster(isMaster());
    window.addEventListener('arcanum-master-change', h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener('arcanum-master-change', h); window.removeEventListener('storage', h); };
  }, []);
  const items = master ? [...navItems, { path: '/mestre', label: 'Mestre', icon: Shield }] : navItems;

  const NavLinks = () => (
    <>
      {items.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200 ${
              isActive
                ? 'nav-active text-primary font-semibold'
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
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background/95 fixed h-full z-40 shadow-[8px_0_26px_-20px_hsl(0_0%_0%/0.9)]">
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-3"><div className="brand-mark w-10 h-10 rounded-lg grid place-items-center text-primary-foreground"><Dices className="w-5 h-5" /></div><div><h1 className="text-2xl font-display font-black gradient-text tracking-widest leading-none">ARCANUM</h1><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Ferramentas para sua mesa</p></div></div>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <p className="section-kicker px-3 pb-2 pt-1">Livro da campanha</p>
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-border/50 space-y-2">
          <ThemeSwitcher />
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => confirm('Sair da conta neste aparelho?') && logout()}>
            <LogOut className="w-4 h-4 mr-2" /> Sair da conta
          </Button>
          <GlobalTimerBar />
          <div className="text-[10px] text-muted-foreground/50 text-center">⚔️ Arcanum v2.0</div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/85 backdrop-blur-2xl border-b border-primary/15 shadow-lg shadow-black/10">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card/95 backdrop-blur-lg border-border/50 flex flex-col h-full">
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center gap-3"><div className="brand-mark w-9 h-9 rounded-lg grid place-items-center text-primary-foreground"><Dices className="w-5 h-5" /></div><div><h1 className="text-2xl font-display font-black gradient-text tracking-widest leading-none">ARCANUM</h1><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Ferramentas para sua mesa</p></div></div>
            </div>
            <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
              <p className="section-kicker px-3 pb-2 pt-1">Livro da campanha</p>
              <NavLinks />
            </nav>
            <div className="p-3 border-t border-border/50 space-y-2">
              <ThemeSwitcher />
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => confirm('Sair da conta neste aparelho?') && logout()}>
                <LogOut className="w-4 h-4 mr-2" /> Sair da conta
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-display font-black tracking-widest gradient-text">ARCANUM</h1>
        <div className="ml-auto">
          <GlobalTimerBar />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden md:ml-64 p-4 md:p-8 pt-16 md:pt-8 min-h-screen subtle-pattern">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
