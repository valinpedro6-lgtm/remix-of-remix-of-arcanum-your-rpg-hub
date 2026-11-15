import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface HubTab {
  value: string;
  label: string;
  icon: LucideIcon;
  element: ReactNode;
}

interface HubTabsProps {
  title: string;
  subtitle?: string;
  tabs: HubTab[];
}

export const HubTabs = ({ title, subtitle, tabs }: HubTabsProps) => {
  const [params, setParams] = useSearchParams();
  const current = tabs.some(t => t.value === params.get('t')) ? params.get('t')! : tabs[0].value;

  return (
    <div className="hub-shell min-w-0 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="hub-header">
        <div><p className="eyebrow">Arcanum workspace</p><h1 className="page-title mt-1">{title}</h1>{subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}</div>
        <div className="hub-meta hidden sm:flex"><span className="status-pulse" /> Área ativa</div>
      </motion.div>

      <Tabs
        value={current}
        onValueChange={v => setParams(v === tabs[0].value ? {} : { t: v }, { replace: true })}
        className="w-full min-w-0"
      >
        <div className="hub-tabs-scroll w-full max-w-full overflow-x-auto no-scrollbar">
        <TabsList className="hub-tabs-list w-max min-w-full flex justify-start h-auto p-1">
          {tabs.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="hub-tab flex-1 min-w-fit gap-2 py-2.5 data-[state=active]:bg-primary/12 data-[state=active]:text-primary"
            >
              <t.icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>

        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value} className="mt-4 embedded-page min-w-0">
            {t.element}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
