import { UserPlus, Coins, CloudSun, ScrollText } from 'lucide-react';
import { HubTabs } from '@/components/HubTabs';
import NPCGenerator from './NPCGenerator';
import LootGenerator from './LootGenerator';
import Environment from './Environment';
import StoryIdeaGenerator from './StoryIdeaGenerator';

const GeneratorsHub = () => (
  <HubTabs
    title="Geradores"
    subtitle="NPCs, tesouros, mundo e ideias com identidade"
    tabs={[
      { value: 'npc', label: 'NPCs', icon: UserPlus, element: <NPCGenerator /> },
      { value: 'loot', label: 'Loot', icon: Coins, element: <LootGenerator /> },
      { value: 'ambiente', label: 'Ambiente', icon: CloudSun, element: <Environment /> },
      { value: 'historia', label: 'Ideias de história', icon: ScrollText, element: <StoryIdeaGenerator /> },
    ]}
  />
);

export default GeneratorsHub;
