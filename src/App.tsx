import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AccessGate } from "@/components/AccessGate";
import Index from "./pages/Index";
import Notes from "./pages/Notes";
import Dashboard from "./pages/Dashboard";
import TableHub from "./pages/TableHub";
import SheetsHub from "./pages/SheetsHub";
import GeneratorsHub from "./pages/GeneratorsHub";
import CompendiumHub from "./pages/CompendiumHub";
import MindMap from "./pages/MindMap";
import Cast from "./pages/Cast";
import SharedSheet from "./pages/SharedSheet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          {/* Ficha pública do jogador (sem senha) */}
          <Route path="/ficha/:shareId" element={<SharedSheet />} />
          <Route path="*" element={
            <AccessGate>
              <Layout>
                <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/elenco" element={<Cast />} />
            <Route path="/painel" element={<Dashboard />} />
            <Route path="/mesa" element={<TableHub />} />
            <Route path="/fichas" element={<SheetsHub />} />
            <Route path="/geradores" element={<GeneratorsHub />} />
            <Route path="/compendio" element={<CompendiumHub />} />
            <Route path="/notas" element={<Notes />} />
            <Route path="/mapa" element={<MindMap />} />

            {/* Rotas antigas → novos hubs */}
            <Route path="/dados" element={<Navigate to="/mesa?t=dados" replace />} />
            <Route path="/iniciativa" element={<Navigate to="/mesa?t=iniciativa" replace />} />
            <Route path="/timer" element={<Navigate to="/mesa?t=timer" replace />} />
            <Route path="/taverna" element={<Navigate to="/mesa?t=taverna" replace />} />
            <Route path="/jogadores" element={<Navigate to="/fichas" replace />} />
            <Route path="/monstros" element={<Navigate to="/fichas?t=monstros" replace />} />
            <Route path="/npc" element={<Navigate to="/geradores" replace />} />
            <Route path="/loot" element={<Navigate to="/geradores?t=loot" replace />} />
            <Route path="/ambiente" element={<Navigate to="/geradores?t=ambiente" replace />} />
            <Route path="/magias" element={<Navigate to="/compendio" replace />} />
            <Route path="/armas" element={<Navigate to="/compendio?t=armas" replace />} />
            <Route path="/pocoes" element={<Navigate to="/compendio?t=pocoes" replace />} />

            <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </AccessGate>
          } />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
