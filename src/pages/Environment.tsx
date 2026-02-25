import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TreePine, Mountain, Waves, Sun, Building2, Shrub,
  ArrowDown, MapPin, CloudRain, CloudSnow, CloudLightning,
  Cloud, CloudSun, Thermometer, Wind, Eye, EyeOff,
  Snowflake, Flame, RefreshCw, AlertTriangle, Clock,
  Sunrise, Sunset, Moon, Zap, ToggleLeft, ToggleRight,
  Palmtree, Castle, Tent, Ship, Skull, Compass,
  Users, Trash2, Plus, Edit, X, Check
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---

type RegionType =
  | 'floresta' | 'montanha' | 'costa' | 'deserto' | 'cidade' | 'pantano' | 'subterraneo'
  | 'tundra' | 'savana' | 'vulcanico' | 'arquipelago' | 'ruinas' | 'acampamento' | 'navio'
  | 'cemiterio' | 'planicie' | 'personalizado';

type WeatherType = 'sol' | 'nublado' | 'chuva' | 'tempestade' | 'neblina' | 'neve'
  | 'calor_extremo' | 'vento_forte' | 'granizo' | 'aurora_magica' | 'chuva_acida' | 'eclipse';

type Intensity = 'leve' | 'moderado' | 'intenso';
type EventMode = 'automatico' | 'sugestao' | 'manual';
type TimeOfDayType = 'amanhecer' | 'manha' | 'tarde' | 'anoitecer' | 'noite' | 'madrugada';

interface WeatherState {
  type: WeatherType;
  intensity: Intensity;
  durationGameMinutes: number;
  elapsedGameMinutes: number;
  effects: string[];
}

interface EnvironmentEvent {
  id: string;
  description: string;
  mechanicalEffect: string;
  timestamp: number;
  category?: string;
}

interface EnvironmentState {
  region: RegionType;
  customRegionName: string;
  weather: WeatherState;
  events: EnvironmentEvent[];
  eventMode: EventMode;
  autoWeather: boolean;
  lastWeatherChangeTimestamp: number;
  manualTimeOverride: boolean;
  manualHour: number;
  manualMinute: number;
  manualDay: number;
}

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

// --- DATA ---

const REGIONS: { value: RegionType; label: string; icon: typeof TreePine; emoji: string; category: string }[] = [
  // Fantasia
  { value: 'floresta', label: 'Floresta', icon: TreePine, emoji: '🌲', category: 'Natureza' },
  { value: 'montanha', label: 'Montanha', icon: Mountain, emoji: '⛰️', category: 'Natureza' },
  { value: 'costa', label: 'Costa', icon: Waves, emoji: '🌊', category: 'Natureza' },
  { value: 'deserto', label: 'Deserto', icon: Sun, emoji: '🏜️', category: 'Natureza' },
  { value: 'pantano', label: 'Pântano', icon: Shrub, emoji: '🐊', category: 'Natureza' },
  { value: 'planicie', label: 'Planície', icon: Compass, emoji: '🌾', category: 'Natureza' },
  { value: 'tundra', label: 'Tundra', icon: Snowflake, emoji: '🧊', category: 'Natureza' },
  { value: 'savana', label: 'Savana', icon: Palmtree, emoji: '🦁', category: 'Natureza' },
  // Civilização
  { value: 'cidade', label: 'Cidade', icon: Building2, emoji: '🏰', category: 'Civilização' },
  { value: 'ruinas', label: 'Ruínas', icon: Castle, emoji: '🏚️', category: 'Civilização' },
  { value: 'acampamento', label: 'Acampamento', icon: Tent, emoji: '⛺', category: 'Civilização' },
  // Especial
  { value: 'subterraneo', label: 'Subterrâneo', icon: ArrowDown, emoji: '🕳️', category: 'Especial' },
  { value: 'vulcanico', label: 'Vulcânico', icon: Flame, emoji: '🌋', category: 'Especial' },
  { value: 'arquipelago', label: 'Arquipélago', icon: Ship, emoji: '🏝️', category: 'Especial' },
  { value: 'navio', label: 'Navio', icon: Ship, emoji: '⛵', category: 'Especial' },
  { value: 'cemiterio', label: 'Cemitério', icon: Skull, emoji: '💀', category: 'Especial' },
  { value: 'personalizado', label: 'Personalizado', icon: MapPin, emoji: '📍', category: 'Especial' },
];

const WEATHER_INFO: Record<WeatherType, { label: string; icon: typeof Sun; emoji: string }> = {
  sol: { label: 'Sol', icon: CloudSun, emoji: '☀️' },
  nublado: { label: 'Nublado', icon: Cloud, emoji: '☁️' },
  chuva: { label: 'Chuva', icon: CloudRain, emoji: '🌧️' },
  tempestade: { label: 'Tempestade', icon: CloudLightning, emoji: '⛈️' },
  neblina: { label: 'Neblina', icon: Eye, emoji: '🌫️' },
  neve: { label: 'Neve', icon: CloudSnow, emoji: '❄️' },
  calor_extremo: { label: 'Calor Extremo', icon: Thermometer, emoji: '🔥' },
  vento_forte: { label: 'Vento Forte', icon: Wind, emoji: '💨' },
  granizo: { label: 'Granizo', icon: CloudSnow, emoji: '🧊' },
  aurora_magica: { label: 'Aurora Mágica', icon: Sunrise, emoji: '✨' },
  chuva_acida: { label: 'Chuva Ácida', icon: CloudRain, emoji: '☢️' },
  eclipse: { label: 'Eclipse', icon: Moon, emoji: '🌑' },
};

const INTENSITY_LABEL: Record<Intensity, string> = { leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso' };

const WEATHER_PROBABILITIES: Record<RegionType, Partial<Record<WeatherType, number>>> = {
  floresta: { sol: 25, nublado: 25, chuva: 25, tempestade: 10, neblina: 10, neve: 2, vento_forte: 3 },
  montanha: { sol: 15, nublado: 20, chuva: 15, tempestade: 10, neblina: 10, neve: 15, vento_forte: 10, granizo: 5 },
  costa: { sol: 30, nublado: 20, chuva: 20, tempestade: 15, neblina: 5, vento_forte: 10 },
  deserto: { sol: 35, calor_extremo: 30, vento_forte: 15, nublado: 10, tempestade: 5, eclipse: 5 },
  cidade: { sol: 30, nublado: 30, chuva: 20, tempestade: 5, neblina: 10, neve: 3, vento_forte: 2 },
  pantano: { sol: 10, nublado: 20, chuva: 30, neblina: 25, tempestade: 10, calor_extremo: 5 },
  subterraneo: { nublado: 50, neblina: 25, vento_forte: 10, aurora_magica: 10, chuva_acida: 5 },
  tundra: { neve: 35, vento_forte: 25, nublado: 15, sol: 10, tempestade: 10, granizo: 5 },
  savana: { sol: 35, calor_extremo: 25, nublado: 15, vento_forte: 10, chuva: 10, tempestade: 5 },
  vulcanico: { calor_extremo: 35, nublado: 20, chuva_acida: 15, neblina: 15, tempestade: 10, aurora_magica: 5 },
  arquipelago: { sol: 30, chuva: 20, tempestade: 15, vento_forte: 15, nublado: 15, neblina: 5 },
  ruinas: { nublado: 25, neblina: 25, vento_forte: 15, chuva: 15, sol: 10, aurora_magica: 5, eclipse: 5 },
  acampamento: { sol: 30, nublado: 25, chuva: 20, vento_forte: 10, neblina: 10, neve: 5 },
  navio: { sol: 20, vento_forte: 25, chuva: 20, tempestade: 20, nublado: 10, neblina: 5 },
  cemiterio: { neblina: 30, nublado: 25, chuva: 15, eclipse: 10, aurora_magica: 10, vento_forte: 10 },
  planicie: { sol: 30, nublado: 25, vento_forte: 20, chuva: 10, tempestade: 10, calor_extremo: 5 },
  personalizado: { sol: 15, nublado: 15, chuva: 12, tempestade: 8, neblina: 10, neve: 8, calor_extremo: 8, vento_forte: 8, granizo: 4, aurora_magica: 4, chuva_acida: 4, eclipse: 4 },
};

const WEATHER_EFFECTS: Record<WeatherType, Record<Intensity, string[]>> = {
  sol: { leve: ['Visibilidade normal'], moderado: ['Visibilidade excelente'], intenso: ['+1 Percepção visual'] },
  nublado: { leve: ['Sem efeitos'], moderado: ['Luz difusa'], intenso: ['-1 Percepção visual a distância'] },
  chuva: {
    leve: ['Terreno levemente escorregadio'],
    moderado: ['-1 Percepção', 'Terreno escorregadio'],
    intenso: ['-2 Percepção', 'Terreno muito escorregadio', 'Fogo se apaga em 1d4 rodadas'],
  },
  tempestade: {
    leve: ['-1 Percepção', 'Vento moderado'],
    moderado: ['-2 Percepção', 'Raios ocasionais', 'Desvantagem em ataques à distância'],
    intenso: ['-3 Percepção', 'Raios frequentes (1d20, nat 1 = atingido)', 'Impossível comunicar a distância'],
  },
  neblina: {
    leve: ['Visibilidade reduzida (60m)'],
    moderado: ['Visibilidade muito reduzida (9m)', '+2 Furtividade'],
    intenso: ['Visibilidade quase nula (3m)', '+5 Furtividade', 'Desvantagem ataques à distância'],
  },
  neve: {
    leve: ['Terreno levemente escorregadio', 'Frio leve'],
    moderado: ['-1 Destreza', 'Terreno difícil', 'Teste CON CD 10/hora'],
    intenso: ['-2 Destreza', 'Terreno muito difícil', 'Teste CON CD 15/hora ou exaustão'],
  },
  calor_extremo: {
    leve: ['Desconforto leve'],
    moderado: ['Teste CON CD 10/hora ou exaustão', 'Necessidade dobrada de água'],
    intenso: ['Teste CON CD 15/hora ou exaustão', '1d4 dano de fogo/hora sem proteção'],
  },
  vento_forte: {
    leve: ['Vento perceptível'],
    moderado: ['Desvantagem ataques à distância', 'Fogo oscila'],
    intenso: ['Impossível ataques à distância', 'Criaturas pequenas: teste FOR CD 12 ou caem', 'Fogo se apaga'],
  },
  granizo: {
    leve: ['1 dano por minuto de exposição'],
    moderado: ['1d4 dano por minuto', 'Terreno escorregadio', 'Desvantagem Percepção'],
    intenso: ['2d4 dano por minuto', 'Terreno muito difícil', 'Visibilidade 9m'],
  },
  aurora_magica: {
    leve: ['+1 em testes de Arcana', 'Luzes místicas no céu'],
    moderado: ['+2 em testes de Arcana', 'Magias ganham +1 CD', 'Criaturas mágicas agitadas'],
    intenso: ['+3 em testes de Arcana', 'Magias ganham +2 CD', 'Surtos de magia selvagem (5% por conjuração)'],
  },
  chuva_acida: {
    leve: ['Corrosão leve em metal', '1 dano por 10 min exposto'],
    moderado: ['1d4 dano por 10 min', 'Equipamento metálico: -1 CA após 1 hora', 'Plantas morrem'],
    intenso: ['1d6 dano por 5 min', 'Equipamento metálico: -2 CA', 'Água contaminada', 'Terreno perigoso'],
  },
  eclipse: {
    leve: ['Escurecimento parcial', 'Criaturas noturnas inquietas'],
    moderado: ['Escuridão como anoitecer', 'Mortos-vivos +1 ataque', 'Animais se escondem'],
    intenso: ['Escuridão total', 'Mortos-vivos +2 ataque e dano', 'Portais sombrios podem abrir', 'Teste SAB CD 13 ou medo'],
  },
};

const ENVIRONMENTAL_EVENTS: Record<RegionType, { weather: WeatherType[]; events: { desc: string; effect: string; category: string }[] }[]> = {
  floresta: [
    { weather: ['chuva', 'tempestade'], events: [
      { desc: '🌳 Queda de árvore no caminho', effect: 'Teste DEX CD 13 ou 2d6 de dano', category: 'Perigo' },
      { desc: '🌊 Rio transbordou', effect: 'Terreno difícil, teste FOR CD 12 para atravessar', category: 'Terreno' },
      { desc: '🍄 Esporos liberados pela chuva', effect: 'Teste CON CD 11 ou envenenado por 1 hora', category: 'Perigo' },
      { desc: '🐻 Urso buscando abrigo', effect: 'Encontro: urso pardo irritado, pode ser evitado com Natureza CD 14', category: 'Encontro' },
    ]},
    { weather: ['neblina'], events: [
      { desc: '👻 Sons estranhos na neblina', effect: 'Teste SAB CD 12 ou assustado por 1 min', category: 'Mistério' },
      { desc: '🕸️ Emboscada de criaturas', effect: 'Surpresa se Percepção passiva < 14', category: 'Encontro' },
      { desc: '🧚 Fadas brincalhonas', effect: 'Ilusões menores, teste SAB CD 11 para ver através', category: 'Mistério' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🦌 Rebanho de animais cruzando', effect: 'Bloqueio do caminho por 10 min', category: 'Ambiente' },
      { desc: '🌿 Ervas raras encontradas', effect: 'Teste Natureza CD 13: 1d4 ervas medicinais', category: 'Recurso' },
      { desc: '🏕️ Acampamento abandonado', effect: 'Teste Investigação CD 12: suprimentos ou pista', category: 'Exploração' },
      { desc: '🎵 Canção distante na floresta', effect: 'Seguir: possível aliado ou armadilha fey', category: 'Mistério' },
    ]},
    { weather: ['aurora_magica'], events: [
      { desc: '✨ Árvore anciã brilha', effect: 'Toque cura 2d8 PV, uma vez por pessoa', category: 'Bênção' },
    ]},
  ],
  montanha: [
    { weather: ['vento_forte', 'tempestade', 'granizo'], events: [
      { desc: '🪨 Risco de avalanche!', effect: 'Teste DEX CD 15 ou 4d6 de dano e soterrado', category: 'Perigo' },
      { desc: '⚡ Raio atinge perto', effect: 'Teste DEX CD 12 ou 2d8 de dano elétrico', category: 'Perigo' },
      { desc: '🦅 Grifos atacam durante tempestade', effect: 'Encontro: 1d2 grifos, desvantagem em ataques à distância', category: 'Encontro' },
    ]},
    { weather: ['neve'], events: [
      { desc: '❄️ Caminho congelado', effect: 'Teste Acrobacia CD 13 ou cai, 1d6 dano', category: 'Terreno' },
      { desc: '🐺 Lobos famintos', effect: 'Encontro: 1d4+2 lobos', category: 'Encontro' },
      { desc: '🏔️ Caverna natural encontrada', effect: 'Abrigo seguro, mas pode ter habitante', category: 'Exploração' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🦅 Águia gigante observando', effect: 'Possível montaria ou combate', category: 'Encontro' },
      { desc: '⛏️ Veio de minério exposto', effect: 'Teste Mineração CD 14: 2d10 GP em gemas', category: 'Recurso' },
    ]},
  ],
  costa: [
    { weather: ['tempestade', 'vento_forte'], events: [
      { desc: '🌊 Onda gigante!', effect: 'Teste FOR CD 14 ou arrastado 9m, 2d6 dano', category: 'Perigo' },
      { desc: '🚢 Navio naufragado à vista', effect: 'Possível exploração ou salvamento', category: 'Exploração' },
      { desc: '🦈 Tubarões se aproximam da costa', effect: 'Nadar: teste Atletismo CD 15 ou 3d6 dano', category: 'Perigo' },
    ]},
    { weather: ['sol', 'nublado', 'chuva'], events: [
      { desc: '🦀 Maré mudou, revelando caverna', effect: 'Acesso a área secreta por 2 horas', category: 'Exploração' },
      { desc: '🐚 Pérola mágica na praia', effect: 'Teste Percepção CD 16: pérola vale 50 GP', category: 'Recurso' },
      { desc: '🧜 Tritão emerge das águas', effect: 'Possível aliado ou comerciante aquático', category: 'Encontro' },
    ]},
  ],
  deserto: [
    { weather: ['calor_extremo'], events: [
      { desc: '🏜️ Tempestade de areia!', effect: 'Visibilidade 0, teste CON CD 14/rodada ou sufoca', category: 'Perigo' },
      { desc: '💀 Miragem enganosa', effect: 'Teste SAB CD 13 ou perde 1 hora de viagem', category: 'Mistério' },
      { desc: '🦂 Ninho de escorpiões', effect: 'Teste Percepção CD 13 ou 2d4 escorpiões gigantes surgem', category: 'Encontro' },
    ]},
    { weather: ['vento_forte'], events: [
      { desc: '🦂 Escorpiões emergem da areia', effect: 'Encontro: 2d4 escorpiões gigantes', category: 'Encontro' },
      { desc: '🏛️ Ruínas parcialmente reveladas pelo vento', effect: 'Teste Investigação CD 12: tesouro ou armadilha', category: 'Exploração' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🐪 Caravana de mercadores', effect: 'Comércio disponível, itens exóticos', category: 'Encontro' },
      { desc: '🏺 Oásis encontrado', effect: 'Descanso seguro, água fresca, +1d8 PV recuperados', category: 'Recurso' },
    ]},
    { weather: ['eclipse'], events: [
      { desc: '🌑 Criaturas sombrias surgem nas dunas', effect: 'Encontro: 1d4 sombras, surpresa se Percepção < 14', category: 'Encontro' },
    ]},
  ],
  cidade: [
    { weather: ['chuva', 'tempestade'], events: [
      { desc: '🏚️ Inundação nas ruas baixas', effect: 'Terreno difícil, comércios fechados', category: 'Ambiente' },
      { desc: '🐀 Ratos saem dos esgotos', effect: 'Risco de doença, teste CON CD 10', category: 'Perigo' },
      { desc: '🔥 Raio incendeia edifício', effect: 'Ajudar: +2 reputação. Saquear: teste Furtividade CD 14', category: 'Evento' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🎪 Festival de rua!', effect: '+2 em testes sociais, preços 20% menores', category: 'Evento' },
      { desc: '🗡️ Briga na rua', effect: 'Guardas ocupados, oportunidade ou perigo', category: 'Evento' },
      { desc: '📜 Arauto anuncia recompensa', effect: 'Nova missão disponível: capturar criminoso, 100 GP', category: 'Missão' },
      { desc: '🎭 Trupe de artistas', effect: 'Entretenimento, possível informação com Persuasão CD 12', category: 'Encontro' },
    ]},
    { weather: ['neblina'], events: [
      { desc: '🗡️ Ladrões agem na neblina', effect: 'Teste Percepção CD 14 ou roubo de 2d10 GP', category: 'Perigo' },
    ]},
  ],
  pantano: [
    { weather: ['chuva', 'neblina'], events: [
      { desc: '🫧 Gás do pântano!', effect: 'Teste CON CD 13 ou envenenado e confuso por 1 hora', category: 'Perigo' },
      { desc: '🐊 Crocodilo emboscado', effect: 'Surpresa se Percepção passiva < 15', category: 'Encontro' },
      { desc: '🧟 Mortos-vivos emergem da lama', effect: 'Encontro: 1d6 zumbis, terreno difícil', category: 'Encontro' },
    ]},
    { weather: ['sol', 'nublado', 'calor_extremo'], events: [
      { desc: '🦟 Enxame de insetos', effect: '-1 em tudo até descanso, risco de doença', category: 'Ambiente' },
      { desc: '🌿 Planta carnívora gigante', effect: 'Teste Percepção CD 13 ou agarrado, FOR CD 15 para escapar', category: 'Perigo' },
    ]},
  ],
  subterraneo: [
    { weather: ['nublado', 'neblina', 'vento_forte'], events: [
      { desc: '🪨 Desmoronamento parcial', effect: 'Teste DEX CD 14 ou 3d6 de dano, caminho bloqueado', category: 'Perigo' },
      { desc: '💧 Infiltração de água', effect: 'Terreno escorregadio, tochas podem apagar', category: 'Terreno' },
      { desc: '🕷️ Teia gigante bloqueia passagem', effect: 'Teste FOR CD 12 para romper ou contornar', category: 'Encontro' },
    ]},
    { weather: ['aurora_magica'], events: [
      { desc: '💎 Cristais mágicos brilham', effect: 'Iluminação natural, +1 em testes de Arcana, gemas 2d20 GP', category: 'Recurso' },
      { desc: '🌀 Portal instável', effect: 'Teste Arcana CD 15: transporte ou 3d6 dano de força', category: 'Mistério' },
    ]},
    { weather: ['chuva_acida'], events: [
      { desc: '☠️ Gotejamento corrosivo', effect: '1d4 dano por rodada, teste Percepção CD 12 para evitar', category: 'Perigo' },
    ]},
  ],
  tundra: [
    { weather: ['neve', 'vento_forte', 'granizo'], events: [
      { desc: '🐻‍❄️ Urso polar esfomeado', effect: 'Encontro: urso polar, FOR 20, 2d6+5 dano', category: 'Encontro' },
      { desc: '❄️ Fissura no gelo', effect: 'Teste Percepção CD 14, falha: cai 6m, 2d6 dano, preso', category: 'Perigo' },
      { desc: '🏠 Cabana congelada', effect: 'Abrigo: descanso curto seguro, possível loot', category: 'Exploração' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🦌 Manada de alces', effect: 'Caça: Sobrevivência CD 13 para 3 dias de rações', category: 'Recurso' },
      { desc: '🗿 Monolito antigo', effect: 'Teste Arcana/História CD 14: informação sobre a região', category: 'Mistério' },
    ]},
  ],
  savana: [
    { weather: ['sol', 'calor_extremo'], events: [
      { desc: '🦁 Orgulho de leões', effect: 'Encontro: 1d4 leões, podem ser evitados com Furtividade CD 15', category: 'Encontro' },
      { desc: '🐘 Manada de elefantes', effect: 'Bloqueio do caminho, Natureza CD 12 para passar seguro', category: 'Ambiente' },
      { desc: '🔥 Incêndio na grama seca', effect: 'Fogo se espalha, teste DEX CD 13 para fugir ou 2d6 fogo', category: 'Perigo' },
    ]},
    { weather: ['chuva', 'tempestade'], events: [
      { desc: '🌊 Inundação repentina', effect: 'Terreno alagado, teste FOR CD 12 ou arrastado 6m', category: 'Perigo' },
    ]},
    { weather: ['vento_forte'], events: [
      { desc: '🌪️ Redemoinho de poeira', effect: 'Visibilidade 3m por 1d4 minutos, -2 Percepção', category: 'Ambiente' },
    ]},
  ],
  vulcanico: [
    { weather: ['calor_extremo', 'chuva_acida'], events: [
      { desc: '🌋 Erupção menor!', effect: 'Lava em área, teste DEX CD 16 ou 4d6 fogo, terreno perigoso', category: 'Perigo' },
      { desc: '💨 Gases vulcânicos', effect: 'Teste CON CD 14/rodada ou envenenado e exaustão', category: 'Perigo' },
      { desc: '🔥 Elemental de fogo emerge', effect: 'Encontro: elemental de fogo, imune a fogo', category: 'Encontro' },
    ]},
    { weather: ['nublado', 'neblina'], events: [
      { desc: '�ite Obsidiana bruta', effect: 'Teste Mineração CD 15: arma +1 ou 3d10 GP', category: 'Recurso' },
    ]},
    { weather: ['aurora_magica'], events: [
      { desc: '🔮 Fragmento elemental', effect: 'Item: pedra de fogo (3 usos de Bola de Fogo)', category: 'Recurso' },
    ]},
  ],
  arquipelago: [
    { weather: ['sol', 'nublado'], events: [
      { desc: '🏝️ Ilha desconhecida avistada', effect: 'Exploração: tesouro, perigo ou civilização', category: 'Exploração' },
      { desc: '🐢 Tartaruga gigante', effect: 'Montaria aquática possível, Natureza CD 14', category: 'Encontro' },
    ]},
    { weather: ['tempestade', 'vento_forte'], events: [
      { desc: '🌊 Maelstrom!', effect: 'Teste Atletismo CD 16 ou arrastado, 3d6 dano', category: 'Perigo' },
      { desc: '🐙 Kraken jovem', effect: 'Encontro épico: kraken juvenil', category: 'Encontro' },
    ]},
  ],
  ruinas: [
    { weather: ['neblina', 'nublado', 'eclipse'], events: [
      { desc: '👻 Espíritos guardiões', effect: 'Teste SAB CD 14 ou assustado, podem dar informações', category: 'Mistério' },
      { desc: '🪤 Armadilha antiga ativada', effect: 'Teste Percepção CD 15, falha: 3d6 dano e efeito', category: 'Perigo' },
      { desc: '📖 Inscrições antigas', effect: 'Teste História CD 13: mapa ou feitiço antigo', category: 'Exploração' },
    ]},
    { weather: ['sol', 'chuva'], events: [
      { desc: '🏛️ Câmara secreta revelada', effect: 'Tesouro: 2d20 GP + item mágico (10% chance)', category: 'Recurso' },
    ]},
    { weather: ['aurora_magica'], events: [
      { desc: '✨ Runas brilham', effect: 'Portal temporal: visão do passado, Arcana CD 15 para info', category: 'Mistério' },
    ]},
  ],
  acampamento: [
    { weather: ['sol', 'nublado'], events: [
      { desc: '🎯 Mercador itinerante', effect: 'Comércio: itens comuns, preços normais', category: 'Encontro' },
      { desc: '🐴 Cavalos soltos', effect: 'Natureza CD 12: montaria temporária', category: 'Recurso' },
    ]},
    { weather: ['chuva', 'tempestade', 'neve'], events: [
      { desc: '🏕️ Barraca desmorona', effect: 'Sem descanso longo, teste Sobrevivência CD 10 para reparar', category: 'Ambiente' },
      { desc: '🐺 Predadores noturnos rondando', effect: 'Teste Percepção CD 13 para notar, podem atacar à noite', category: 'Perigo' },
    ]},
    { weather: ['vento_forte'], events: [
      { desc: '🔥 Fogueira apagada pelo vento', effect: 'Escuridão, sem cozinhar, sem calor', category: 'Ambiente' },
    ]},
  ],
  navio: [
    { weather: ['tempestade', 'vento_forte'], events: [
      { desc: '🌊 Mar revolto!', effect: 'Teste CON CD 13 ou enjoado, -2 em tudo por 1 hora', category: 'Ambiente' },
      { desc: '☠️ Navio pirata!', effect: 'Encontro: 2d6 piratas, capitão CR 4', category: 'Encontro' },
      { desc: '🐙 Monstro marinho ataca', effect: 'Tentáculos: FOR CD 15 ou agarrado, 2d8 dano/rodada', category: 'Encontro' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🐬 Golfinhos acompanham', effect: 'Bom presságio: +1 em todos os testes por 4 horas', category: 'Bênção' },
      { desc: '🏝️ Terra à vista!', effect: 'Ilha: porto, recursos ou perigo', category: 'Exploração' },
    ]},
    { weather: ['neblina'], events: [
      { desc: '👻 Navio fantasma', effect: 'Encontro ou comércio com mortos, SAB CD 14 ou medo', category: 'Mistério' },
    ]},
  ],
  cemiterio: [
    { weather: ['neblina', 'eclipse', 'nublado'], events: [
      { desc: '💀 Mortos-vivos se levantam', effect: 'Encontro: 2d4 esqueletos ou 1d4 zumbis', category: 'Encontro' },
      { desc: '👻 Espírito perdido pede ajuda', effect: 'Missão: resolver assunto pendente, recompensa mágica', category: 'Missão' },
      { desc: '🕯️ Altar profanado', effect: 'Religião CD 14: purificar = bênção, falha = maldição leve', category: 'Mistério' },
    ]},
    { weather: ['aurora_magica'], events: [
      { desc: '✨ Véu entre mundos se afina', effect: 'Comunicar com mortos sem magia por 10 min', category: 'Mistério' },
    ]},
    { weather: ['chuva', 'vento_forte'], events: [
      { desc: '🪦 Túmulo colapsa revelando câmara', effect: 'Exploração: tesouro antigo ou lich dormindo', category: 'Exploração' },
    ]},
  ],
  planicie: [
    { weather: ['sol', 'nublado', 'vento_forte'], events: [
      { desc: '🐎 Cavalaria selvagem ao longe', effect: 'Natureza CD 14: domesticar, ou 1d4+1 cavalos hostis', category: 'Encontro' },
      { desc: '🌾 Campo de trigo esconde algo', effect: 'Investigação CD 13: abrigo secreto, alguém se esconde', category: 'Exploração' },
      { desc: '🦅 Falcão mensageiro pousa perto', effect: 'Mensagem: pista de missão ou pedido de socorro', category: 'Missão' },
    ]},
    { weather: ['tempestade'], events: [
      { desc: '⚡ Raio atinge o campo', effect: 'Incêndio rápido, teste DEX CD 12 para fugir a tempo', category: 'Perigo' },
    ]},
    { weather: ['calor_extremo'], events: [
      { desc: '🏜️ Seca extrema', effect: 'Nenhuma água em 10 km, necessidade urgente', category: 'Ambiente' },
    ]},
  ],
  personalizado: [
    { weather: ['sol', 'nublado', 'chuva', 'tempestade', 'neblina', 'neve', 'calor_extremo', 'vento_forte', 'granizo', 'aurora_magica', 'chuva_acida', 'eclipse'], events: [
      { desc: '⚠️ Evento misterioso', effect: 'O mestre decide o efeito', category: 'Mistério' },
      { desc: '🌀 Anomalia mágica', effect: 'Teste de resistência CD 13 ou efeito aleatório', category: 'Mistério' },
      { desc: '🎲 Encontro aleatório', effect: 'O mestre determina: aliado, inimigo ou neutro', category: 'Encontro' },
    ]},
  ],
};

const EVENT_CATEGORIES = ['Todos', 'Perigo', 'Encontro', 'Exploração', 'Recurso', 'Mistério', 'Ambiente', 'Evento', 'Missão', 'Bênção', 'Terreno'];

// --- HELPERS ---

function weightedRandom<T extends string>(weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function randomIntensity(): Intensity {
  const r = Math.random();
  if (r < 0.4) return 'leve';
  if (r < 0.8) return 'moderado';
  return 'intenso';
}

function randomDuration(): number {
  return (Math.floor(Math.random() * 8) + 1) * 60;
}

function generateWeather(region: RegionType, specificType?: WeatherType, specificIntensity?: Intensity): WeatherState {
  const type = specificType || weightedRandom(WEATHER_PROBABILITIES[region]);
  const intensity = specificIntensity || randomIntensity();
  const duration = randomDuration();
  return {
    type,
    intensity,
    durationGameMinutes: duration,
    elapsedGameMinutes: 0,
    effects: WEATHER_EFFECTS[type]?.[intensity] || ['Efeito desconhecido'],
  };
}

function tryGenerateEvent(region: RegionType, weatherType: WeatherType, categoryFilter?: string): { desc: string; effect: string; category: string } | null {
  const regionEvents = ENVIRONMENTAL_EVENTS[region];
  const matching = regionEvents.filter(e => e.weather.includes(weatherType));
  if (matching.length === 0) return null;
  let allEvents = matching.flatMap(m => m.events);
  if (categoryFilter && categoryFilter !== 'Todos') {
    const filtered = allEvents.filter(e => e.category === categoryFilter);
    if (filtered.length > 0) allEvents = filtered;
  }
  return allEvents[Math.floor(Math.random() * allEvents.length)];
}

function getTimeOfDay(gameMinutes: number): { label: string; icon: typeof Sunrise; emoji: string; type: TimeOfDayType } {
  const hours = Math.floor((gameMinutes % 1440) / 60);
  if (hours >= 5 && hours < 7) return { label: 'Amanhecer', icon: Sunrise, emoji: '🌅', type: 'amanhecer' };
  if (hours >= 7 && hours < 12) return { label: 'Manhã', icon: Sun, emoji: '☀️', type: 'manha' };
  if (hours >= 12 && hours < 17) return { label: 'Tarde', icon: Sun, emoji: '🌤️', type: 'tarde' };
  if (hours >= 17 && hours < 20) return { label: 'Anoitecer', icon: Sunset, emoji: '🌇', type: 'anoitecer' };
  if (hours >= 20 || hours < 2) return { label: 'Noite', icon: Moon, emoji: '🌙', type: 'noite' };
  return { label: 'Madrugada', icon: Moon, emoji: '🌌', type: 'madrugada' };
}

// --- COMPONENT ---

const DEFAULT_ENV: EnvironmentState = {
  region: 'floresta',
  customRegionName: '',
  weather: generateWeather('floresta'),
  events: [],
  eventMode: 'sugestao',
  autoWeather: true,
  lastWeatherChangeTimestamp: 0,
  manualTimeOverride: false,
  manualHour: 8,
  manualMinute: 0,
  manualDay: 1,
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
};

const Environment = () => {
  const [env, setEnv] = useLocalStorage<EnvironmentState>('arcanum-environment', DEFAULT_ENV);
  const [liveGameMinutes, setLiveGameMinutes] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<{ desc: string; effect: string; category: string } | null>(null);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('Todos');
  const [regionTab, setRegionTab] = useState('Natureza');

  // Sync region to localStorage for NPC generator
  useEffect(() => {
    try {
      localStorage.setItem('arcanum-current-region', JSON.stringify(env.region));
    } catch {}
  }, [env.region]);

  // Sync weather to localStorage for NPC generator
  useEffect(() => {
    try {
      localStorage.setItem('arcanum-current-weather', JSON.stringify({
        type: env.weather.type,
        intensity: env.weather.intensity,
        label: WEATHER_INFO[env.weather.type].label,
        effects: env.weather.effects,
      }));
    } catch {}
  }, [env.weather]);

  // Sync time of day to localStorage
  useEffect(() => {
    const gameMinutes = env.manualTimeOverride
      ? (env.manualDay - 1) * 1440 + env.manualHour * 60 + env.manualMinute
      : liveGameMinutes;
    const tod = getTimeOfDay(gameMinutes);
    try {
      localStorage.setItem('arcanum-time-of-day', JSON.stringify({
        ...tod,
        hours: Math.floor((gameMinutes % 1440) / 60),
        minutes: gameMinutes % 60,
        day: Math.floor(gameMinutes / 1440) + 1,
      }));
    } catch {}
  }, [liveGameMinutes, env.manualTimeOverride, env.manualHour, env.manualMinute, env.manualDay]);

  // Compute live game minutes from timer
  useEffect(() => {
    const computeMinutes = () => {
      try {
        const stored = localStorage.getItem('arcanum-timer');
        if (!stored) return;
        const t: TimerState = JSON.parse(stored);
        setTimerIsRunning(t.isRunning);
        if (t.isRunning && t.lastTickTimestamp > 0) {
          const realMsElapsed = Date.now() - t.lastTickTimestamp;
          const realMinutesElapsed = realMsElapsed / 60000;
          const gameMinutesGained = (realMinutesElapsed / t.realMinutesPerGameHour) * 60;
          setLiveGameMinutes(Math.floor(t.gameMinutesElapsed + gameMinutesGained));
        } else {
          setLiveGameMinutes(Math.floor(t.gameMinutesElapsed));
        }
      } catch {}
    };
    computeMinutes();
    const interval = setInterval(computeMinutes, 1000);
    return () => clearInterval(interval);
  }, []);

  const gameMinutes = env.manualTimeOverride
    ? (env.manualDay - 1) * 1440 + env.manualHour * 60 + env.manualMinute
    : liveGameMinutes;

  const timeOfDay = getTimeOfDay(gameMinutes);
  const TimeIcon = timeOfDay.icon;
  const hours = Math.floor((gameMinutes % 1440) / 60);
  const minutes = gameMinutes % 60;
  const days = Math.floor(gameMinutes / 1440);

  // Auto weather change
  useEffect(() => {
    if (!env.autoWeather) return;
    if (env.weather.elapsedGameMinutes >= env.weather.durationGameMinutes) {
      const newWeather = generateWeather(env.region);
      setEnv(prev => ({ ...prev, weather: newWeather, lastWeatherChangeTimestamp: gameMinutes }));
    }
  }, [env.autoWeather, env.weather.elapsedGameMinutes, env.weather.durationGameMinutes, env.region, gameMinutes, setEnv]);

  // Track weather elapsed time
  useEffect(() => {
    if (env.lastWeatherChangeTimestamp === 0) {
      setEnv(prev => ({ ...prev, lastWeatherChangeTimestamp: gameMinutes }));
      return;
    }
    const elapsed = gameMinutes - env.lastWeatherChangeTimestamp;
    if (elapsed > 0 && elapsed !== env.weather.elapsedGameMinutes) {
      setEnv(prev => ({ ...prev, weather: { ...prev.weather, elapsedGameMinutes: elapsed } }));
    }
  }, [gameMinutes, env.lastWeatherChangeTimestamp, env.weather.elapsedGameMinutes, setEnv]);

  // Auto events
  useEffect(() => {
    if (env.eventMode === 'manual') return;
    if (!timerIsRunning && !env.manualTimeOverride) return;
    const lastEventTime = env.events.length > 0 ? env.events[env.events.length - 1].timestamp : 0;
    if (gameMinutes - lastEventTime >= 120 && Math.random() < 0.3) {
      const event = tryGenerateEvent(env.region, env.weather.type);
      if (event) {
        if (env.eventMode === 'automatico') {
          addEvent(event);
        } else {
          setPendingEvent(event);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(gameMinutes / 30)]);

  const addEvent = useCallback((event: { desc: string; effect: string; category?: string }) => {
    setEnv(prev => ({
      ...prev,
      events: [...prev.events.slice(-29), {
        id: crypto.randomUUID(),
        description: event.desc,
        mechanicalEffect: event.effect,
        timestamp: gameMinutes,
        category: event.category || 'Evento',
      }],
    }));
  }, [setEnv, gameMinutes]);

  const changeRegion = (region: RegionType) => {
    const newWeather = generateWeather(region);
    setEnv(prev => ({ ...prev, region, weather: newWeather, lastWeatherChangeTimestamp: gameMinutes, events: [] }));
  };

  const setWeatherManual = (type: WeatherType) => {
    const newWeather = generateWeather(env.region, type);
    setEnv(prev => ({ ...prev, weather: newWeather, lastWeatherChangeTimestamp: gameMinutes }));
  };

  const setIntensityManual = (intensity: Intensity) => {
    setEnv(prev => ({
      ...prev,
      weather: {
        ...prev.weather,
        intensity,
        effects: WEATHER_EFFECTS[prev.weather.type]?.[intensity] || ['Efeito desconhecido'],
      },
    }));
  };

  const rerollWeather = () => {
    const newWeather = generateWeather(env.region);
    setEnv(prev => ({ ...prev, weather: newWeather, lastWeatherChangeTimestamp: gameMinutes }));
  };

  const forceEvent = () => {
    const event = tryGenerateEvent(env.region, env.weather.type, eventCategoryFilter);
    if (event) addEvent(event);
  };

  const clearEvents = () => {
    setEnv(prev => ({ ...prev, events: [] }));
  };

  const WeatherIcon = WEATHER_INFO[env.weather.type].icon;
  const regionInfo = REGIONS.find(r => r.value === env.region)!;
  const RegionIcon = regionInfo.icon;

  const weatherProgress = env.weather.durationGameMinutes > 0
    ? Math.min(100, (env.weather.elapsedGameMinutes / env.weather.durationGameMinutes) * 100)
    : 0;

  const remainingMinutes = Math.max(0, env.weather.durationGameMinutes - env.weather.elapsedGameMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;

  const regionCategories = [...new Set(REGIONS.map(r => r.category))];

  return (
    <div className="space-y-6">
      <h1 className="page-title">Ambiente & Clima</h1>

      {/* Day/Night + Timer sync */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible">
        <Card className="card-hover border-primary/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TimeIcon className="w-8 h-8 text-primary animate-pulse" />
                <div>
                  <p className="text-sm text-primary font-semibold">{timeOfDay.emoji} {timeOfDay.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {days > 0 && <span className="text-muted-foreground text-lg">Dia {days + 1} — </span>}
                    {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <RegionIcon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">{regionInfo.emoji} {regionInfo.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {WEATHER_INFO[env.weather.type].emoji} {WEATHER_INFO[env.weather.type].label}
                </Badge>
              </div>
            </div>

            {/* Manual time override */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnv(prev => ({ ...prev, manualTimeOverride: !prev.manualTimeOverride }))}
                >
                  {env.manualTimeOverride
                    ? <><ToggleRight className="w-4 h-4 text-primary mr-1" /> Tempo Manual</>
                    : <><ToggleLeft className="w-4 h-4 text-muted-foreground mr-1" /> Tempo do Timer</>
                  }
                </Button>
              </div>
              <AnimatePresence>
                {env.manualTimeOverride && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Dia:</label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={env.manualDay}
                          onChange={e => setEnv(prev => ({ ...prev, manualDay: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Hora:</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={env.manualHour}
                          onChange={e => setEnv(prev => ({ ...prev, manualHour: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Min:</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={env.manualMinute}
                          onChange={e => setEnv(prev => ({ ...prev, manualMinute: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm text-center"
                        />
                      </div>
                      <div className="flex gap-1">
                        {(['amanhecer', 'manha', 'tarde', 'anoitecer', 'noite', 'madrugada'] as TimeOfDayType[]).map(tod => {
                          const presets: Record<TimeOfDayType, number> = { amanhecer: 6, manha: 9, tarde: 14, anoitecer: 18, noite: 21, madrugada: 3 };
                          const emojis: Record<TimeOfDayType, string> = { amanhecer: '🌅', manha: '☀️', tarde: '🌤️', anoitecer: '🌇', noite: '🌙', madrugada: '🌌' };
                          return (
                            <Button
                              key={tod}
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2"
                              title={tod}
                              onClick={() => setEnv(prev => ({ ...prev, manualHour: presets[tod], manualMinute: 0 }))}
                            >
                              {emojis[tod]}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Region Selection */}
        <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className="card-hover h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Região
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={regionTab} onValueChange={setRegionTab}>
                <TabsList className="w-full">
                  {regionCategories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-xs flex-1">{cat}</TabsTrigger>
                  ))}
                </TabsList>
                {regionCategories.map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {REGIONS.filter(r => r.category === cat).map(r => (
                        <Button
                          key={r.value}
                          variant={env.region === r.value ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start gap-2 text-xs"
                          onClick={() => changeRegion(r.value)}
                        >
                          <r.icon className="w-4 h-4" />
                          {r.emoji} {r.label}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              {env.region === 'personalizado' && (
                <input
                  className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
                  placeholder="Nome da região..."
                  value={env.customRegionName}
                  onChange={e => setEnv(prev => ({ ...prev, customRegionName: e.target.value }))}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Weather */}
        <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <Card className="card-hover h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <WeatherIcon className="w-5 h-5 text-primary" /> Clima Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <motion.p
                  key={env.weather.type}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl mb-1"
                >
                  {WEATHER_INFO[env.weather.type].emoji}
                </motion.p>
                <p className="text-xl font-display font-bold">{WEATHER_INFO[env.weather.type].label}</p>
                <div className="flex justify-center gap-1 mt-2">
                  {(['leve', 'moderado', 'intenso'] as Intensity[]).map(i => (
                    <Button
                      key={i}
                      variant={env.weather.intensity === i ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs px-3"
                      onClick={() => setIntensityManual(i)}
                    >
                      {INTENSITY_LABEL[i]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Duração restante</span>
                  <span>{remainingHours}h {remainingMins}min</span>
                </div>
                <Progress value={weatherProgress} className="h-2" />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Efeitos mecânicos:</p>
                {env.weather.effects.map((e, i) => (
                  <p key={i} className="text-sm flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary flex-shrink-0" /> {e}
                  </p>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={rerollWeather}>
                <RefreshCw className="w-3 h-3 mr-1" /> Gerar Novo Clima
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Manual Weather Selection */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" /> Escolher Clima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {(Object.keys(WEATHER_INFO) as WeatherType[]).map(type => {
                const info = WEATHER_INFO[type];
                const isActive = env.weather.type === type;
                return (
                  <Button
                    key={type}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-xs"
                    onClick={() => setWeatherManual(type)}
                  >
                    <span className="text-lg">{info.emoji}</span>
                    <span>{info.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Clima automático:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnv(prev => ({ ...prev, autoWeather: !prev.autoWeather }))}
                >
                  {env.autoWeather
                    ? <><ToggleRight className="w-5 h-5 text-primary" /> Ativo</>
                    : <><ToggleLeft className="w-5 h-5 text-muted-foreground" /> Inativo</>
                  }
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Eventos:</span>
                <Select
                  value={env.eventMode}
                  onValueChange={(v: EventMode) => setEnv(prev => ({ ...prev, eventMode: v }))}
                >
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatico">Automático</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Event */}
      <AnimatePresence>
        {pendingEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-primary animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{pendingEvent.category}</Badge>
                    </div>
                    <p className="font-semibold text-primary">{pendingEvent.desc}</p>
                    <p className="text-sm text-muted-foreground">{pendingEvent.effect}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => { addEvent(pendingEvent); setPendingEvent(null); }}>
                      <Check className="w-3 h-3 mr-1" /> Aceitar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingEvent(null)}>
                      <X className="w-3 h-3 mr-1" /> Ignorar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" /> Eventos Ambientais
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={eventCategoryFilter} onValueChange={setEventCategoryFilter}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={forceEvent}>
                  <Zap className="w-3 h-3 mr-1" /> Gerar
                </Button>
                {env.events.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearEvents}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {env.events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento ocorreu ainda</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <AnimatePresence>
                  {[...env.events]
                    .reverse()
                    .filter(e => eventCategoryFilter === 'Todos' || e.category === eventCategoryFilter)
                    .map(event => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-secondary/50 rounded p-3 border border-border/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              {event.category && (
                                <Badge variant="outline" className="text-xs py-0">{event.category}</Badge>
                              )}
                            </div>
                            <p className="font-semibold text-sm">{event.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.mechanicalEffect}</p>
                          </div>
                          <p className="text-xs text-primary/70 flex-shrink-0">
                            ⏱️ {Math.floor(event.timestamp / 1440) > 0 ? `D${Math.floor(event.timestamp / 1440) + 1} ` : ''}
                            {String(Math.floor((event.timestamp % 1440) / 60)).padStart(2, '0')}:
                            {String(event.timestamp % 60).padStart(2, '0')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sync Info */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
        <Card className="card-hover border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Região → NPC</p>
                <p className="font-semibold text-sm">{regionInfo.emoji} {regionInfo.label}</p>
                <p className="text-xs text-primary">NPCs usam esta região</p>
              </div>
              <div className="bg-secondary/50 rounded p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Clima → Mundo</p>
                <p className="font-semibold text-sm">{WEATHER_INFO[env.weather.type].emoji} {WEATHER_INFO[env.weather.type].label}</p>
                <p className="text-xs text-primary">{INTENSITY_LABEL[env.weather.intensity]}</p>
              </div>
              <div className="bg-secondary/50 rounded p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Hora → Encontros</p>
                <p className="font-semibold text-sm">{timeOfDay.emoji} {timeOfDay.label}</p>
                <p className="text-xs text-primary">{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weather Probability Table */}
      <motion.div variants={cardVariant} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-primary" /> Probabilidades ({regionInfo.label})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {Object.entries(WEATHER_PROBABILITIES[env.region]).map(([type, weight]) => {
                const info = WEATHER_INFO[type as WeatherType];
                const total = Object.values(WEATHER_PROBABILITIES[env.region]).reduce((a, b) => a + (b || 0), 0);
                const pct = Math.round(((weight || 0) / total) * 100);
                return (
                  <div key={type} className="bg-secondary/50 rounded p-2 text-center border border-border/50">
                    <p className="text-lg">{info.emoji}</p>
                    <p className="text-xs font-semibold">{info.label}</p>
                    <p className="text-xs text-primary">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Environment;
