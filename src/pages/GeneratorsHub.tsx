import { UserPlus, Coins, CloudSun } from 'lucide-react';
import { HubTabs } from '@/components/HubTabs';
import NPCGenerator from './NPCGenerator';
import LootGenerator from './LootGenerator';
import Environment from './Environment';

const GeneratorsHub = () => (
  <HubTabs
    title="Geradores"
    subtitle="NPCs, tesouros e o mundo ao redor"
    tabs={[
      { value: 'npc', label: 'NPCs', icon: UserPlus, element: <NPCGenerator /> },
      { value: 'loot', label: 'Loot', icon: Coins, element: <LootGenerator /> },
      { value: 'ambiente', label: 'Ambiente', icon: CloudSun, element: <Environment /> },
    ]}
  />
);

export default GeneratorsHub;
