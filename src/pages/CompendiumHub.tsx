import { Sparkles, Sword, FlaskConical } from 'lucide-react';
import { HubTabs } from '@/components/HubTabs';
import Spells from './Spells';
import Weapons from './Weapons';
import Potions from './Potions';

const CompendiumHub = () => (
  <HubTabs
    title="Compêndio"
    subtitle="Magias, armas e poções"
    tabs={[
      { value: 'magias', label: 'Magias', icon: Sparkles, element: <Spells /> },
      { value: 'armas', label: 'Armas', icon: Sword, element: <Weapons /> },
      { value: 'pocoes', label: 'Poções', icon: FlaskConical, element: <Potions /> },
    ]}
  />
);

export default CompendiumHub;
