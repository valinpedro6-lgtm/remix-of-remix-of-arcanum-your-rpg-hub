import { Dices, Swords, Clock, Gamepad2, CalendarDays } from 'lucide-react';
import { HubTabs } from '@/components/HubTabs';
import DiceRoller from './DiceRoller';
import Initiative from './Initiative';
import GameTimer from './GameTimer';
import TavernGames from './TavernGames';
import WorldCalendarPage from './WorldCalendarPage';

const TableHub = () => (
  <HubTabs
    title="Mesa"
    subtitle="Rolagens, combate, tempo, calendário e taverna"
    tabs={[
      { value: 'dados', label: 'Dados', icon: Dices, element: <DiceRoller /> },
      { value: 'iniciativa', label: 'Iniciativa', icon: Swords, element: <Initiative /> },
      { value: 'timer', label: 'Timer', icon: Clock, element: <GameTimer /> },
      { value: 'calendario', label: 'Calendário', icon: CalendarDays, element: <WorldCalendarPage /> },
      { value: 'taverna', label: 'Taverna', icon: Gamepad2, element: <TavernGames /> },
    ]}
  />
);

export default TableHub;
