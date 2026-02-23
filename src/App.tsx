import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import DiceRoller from "./pages/DiceRoller";
import GameTimer from "./pages/GameTimer";
import Initiative from "./pages/Initiative";
import Players from "./pages/Players";
import Monsters from "./pages/Monsters";
import Potions from "./pages/Potions";
import TavernGames from "./pages/TavernGames";
import NPCGenerator from "./pages/NPCGenerator";
import Notes from "./pages/Notes";
import Environment from "./pages/Environment";
import Weapons from "./pages/Weapons";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dados" element={<DiceRoller />} />
            <Route path="/timer" element={<GameTimer />} />
            <Route path="/iniciativa" element={<Initiative />} />
            <Route path="/jogadores" element={<Players />} />
            <Route path="/monstros" element={<Monsters />} />
            <Route path="/pocoes" element={<Potions />} />
            <Route path="/taverna" element={<TavernGames />} />
            <Route path="/npc" element={<NPCGenerator />} />
            <Route path="/notas" element={<Notes />} />
            <Route path="/ambiente" element={<Environment />} />
            <Route path="/armas" element={<Weapons />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
