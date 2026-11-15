import { ReactNode, useEffect, useState } from 'react';
import { isMaster, logout } from '@/lib/access';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  StickyNote, LayoutDashboard, Menu, Gauge, Dices, Wand2, BookOpen, Network,
  Drama, Map as MapIcon, Shield, LogOut, ScrollText,
} from 'lucide-react';
import { GlobalTimerBar } from '@/components/GlobalTimerBar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { CampaignBackup } from '@/components/CampaignBackup';

type NavItem = { path: string; label: string; caption: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Visão geral',
    items: [
      { path: '/', label: 'Início', caption: 'Resumo da campanha', icon: LayoutDashboard },
      { path: '/painel', label: 'Painel', caption: 'Estado da sessão', icon: Gauge },
    ],
  },
  {
    label: 'Preparar',
    items: [
      { path: '/historias', label: 'Histórias', caption: 'Campanha e capítulos', icon: ScrollText },
      { path: '/elenco', label: 'Elenco', caption: 'Fichas e personagens', icon: Drama },
      { path: '/geradores', label: 'Geradores', caption: 'Ideias e conteúdo', icon: Wand2 },
      { path: '/mapa', label: 'Mapa mental', caption: 'Conexões do mundo', icon: Network },
    ],
  },
  {
    label: 'Mesa ao vivo',
    items: [
      { path: '/mesa', label: 'Mesa', caption: 'Dados, iniciativa e timer', icon: Dices },
      { path: '/tabletop', label: 'Tabletop', caption: 'Mapa e tokens', icon: MapIcon },
      { path: '/notas', label: 'Notas', caption: 'Anotações rápidas', icon: StickyNote },
    ],
  },
  {
    label: 'Biblioteca',
    items: [
      { path: '/compendio', label: 'Compêndio', caption: 'Regras e referências', icon: BookOpen },
    ],
  },
];

const allItems = navGroups.flatMap(group => group.items);

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
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
  const activeItem = allItems.find(item => isActive(item.path));
  const groups = master ? [...navGroups, { label: 'Administração', items: [{ path: '/mestre', label: 'Mestre', caption: 'Acessos e campanha', icon: Shield }] }] : navGroups;

  const NavLinks = ({ compact = false }: { compact?: boolean }) => (
    <>
      {groups.map(group => (
        <div key={group.label} className={compact ? 'space-y-1' : 'space-y-1'}>
          {!compact && <p className="nav-section-label px-3 pb-1 pt-4 first:pt-0">{group.label}</p>}
          {group.items.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)} title={`${item.label} — ${item.caption}`} className={`nav-item group ${active ? 'nav-active text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'} ${compact ? 'justify-center px-2' : ''}`}>
                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-transform ${active ? 'text-primary' : 'group-hover:scale-105'}`} />
                <span className="nav-copy min-w-0"><span className="nav-label block truncate">{item.label}</span><span className="nav-caption block truncate">{item.caption}</span></span>
                {active && <span className="nav-dot" />}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="desktop-shell fixed z-40 hidden h-full w-[248px] flex-col border-r border-border/60 bg-card/55 backdrop-blur-2xl md:flex">
        <div className="brand-panel border-b border-border/60 px-5 py-5">
          <div className="flex items-center gap-3"><div className="brand-mark grid h-10 w-10 place-items-center rounded-xl text-primary-foreground"><Dices className="h-5 w-5" /></div><div><div className="brand-wordmark">ARCANUM</div><div className="brand-kicker">CAMPAIGN COMMAND</div></div></div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4"><NavLinks /></nav>
        <div className="border-t border-border/60 p-3">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2"><span className="status-pulse" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Sistema online</p><p className="truncate text-[11px] text-muted-foreground">Workspace sincronizado</p></div></div>
          <div className="flex items-center gap-1"><ThemeSwitcher /><CampaignBackup /><Button variant="ghost" size="icon" className="ml-auto text-muted-foreground" title="Sair da conta" onClick={() => confirm('Sair da conta neste aparelho?') && logout()}><LogOut className="h-4 w-4" /></Button></div>
          <GlobalTimerBar /><div className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-muted-foreground/45">Arcanum · v2.0</div>
        </div>
      </aside>

      <div className="mobile-shell fixed left-0 right-0 top-0 z-50 flex items-center gap-3 border-b border-border/60 bg-background/92 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="mobile-drawer w-[min(92vw,360px)] border-border/60 bg-card/96 p-0 backdrop-blur-xl"><div className="border-b border-border/60 p-5"><div className="flex items-center gap-3"><div className="brand-mark grid h-10 w-10 place-items-center rounded-xl text-primary-foreground"><Dices className="h-5 w-5" /></div><div><div className="brand-wordmark">ARCANUM</div><div className="brand-kicker">CAMPAIGN COMMAND</div></div></div></div><nav className="flex h-[calc(100%-88px)] flex-col overflow-y-auto p-3"><NavLinks /><div className="mt-auto border-t border-border/60 pt-3"><div className="flex items-center gap-1"><ThemeSwitcher /><CampaignBackup /><Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => confirm('Sair da conta neste aparelho?') && logout()}><LogOut className="mr-2 h-4 w-4" />Sair</Button></div></div></nav></SheetContent>
        </Sheet>
        <div className="min-w-0"><div className="mobile-wordmark">ARCANUM</div><p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{activeItem?.label ?? 'Campaign command'}</p></div><div className="ml-auto"><GlobalTimerBar /></div>
      </div>

      <main className="min-h-screen min-w-0 overflow-x-hidden md:ml-[248px] md:pt-0"><div className="shell-content animate-fade-in">{children}</div></main>

      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 gap-1 border-t border-border/60 bg-background/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        {[groups[0].items[0], groups[1].items[0], groups[2].items[0], groups[2].items[1]].map(item => { const active = isActive(item.path); return <Link key={item.path} to={item.path} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}><item.icon className="h-4 w-4" /><span>{item.label}</span></Link>; })}
      </nav>
    </div>
  );
};
