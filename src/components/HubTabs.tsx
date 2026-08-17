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
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </motion.div>

      <Tabs
        value={current}
        onValueChange={v => setParams(v === tabs[0].value ? {} : { t: v }, { replace: true })}
      >
        <TabsList className="w-full flex overflow-x-auto justify-start h-auto p-1 bg-card/60 backdrop-blur-md border border-border/50">
          {tabs.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex-1 min-w-fit gap-2 py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
            >
              <t.icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value} className="mt-4 embedded-page">
            {t.element}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
