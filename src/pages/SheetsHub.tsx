import { Users, Skull } from 'lucide-react';
import { HubTabs } from '@/components/HubTabs';
import Players from './Players';
import Monsters from './Monsters';

const SheetsHub = () => (
  <HubTabs
    title="Fichas"
    subtitle="Jogadores e criaturas em um só lugar"
    tabs={[
      { value: 'jogadores', label: 'Jogadores', icon: Users, element: <Players /> },
      { value: 'monstros', label: 'Monstros', icon: Skull, element: <Monsters /> },
    ]}
  />
);

export default SheetsHub;
