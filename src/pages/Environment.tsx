import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TreePine, Mountain, Waves, Sun, Building2, Shrub,
  ArrowDown, MapPin, CloudRain, CloudSnow, CloudLightning,
  Cloud, CloudSun, Thermometer, Wind, Eye, EyeOff,
  Snowflake, Flame, RefreshCw, AlertTriangle, Clock,
  Sunrise, Sunset, Moon, Zap, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- TYPES ---

type RegionType = 'floresta' | 'montanha' | 'costa' | 'deserto' | 'cidade' | 'pantano' | 'subterraneo' | 'personalizado';
type WeatherType = 'sol' | 'nublado' | 'chuva' | 'tempestade' | 'neblina' | 'neve' | 'calor_extremo' | 'vento_forte';
type Intensity = 'leve' | 'moderado' | 'intenso';
type EventMode = 'automatico' | 'sugestao' | 'manual';

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
}

interface EnvironmentState {
  region: RegionType;
  customRegionName: string;
  weather: WeatherState;
  events: EnvironmentEvent[];
  eventMode: EventMode;
  autoWeather: boolean;
  lastWeatherChangeTimestamp: number;
}

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

// --- DATA ---

const REGIONS: { value: RegionType; label: string; icon: typeof TreePine; emoji: string }[] = [
  { value: 'floresta', label: 'Floresta', icon: TreePine, emoji: '🌲' },
  { value: 'montanha', label: 'Montanha', icon: Mountain, emoji: '⛰️' },
  { value: 'costa', label: 'Costa', icon: Waves, emoji: '🌊' },
  { value: 'deserto', label: 'Deserto', icon: Sun, emoji: '🏜️' },
  { value: 'cidade', label: 'Cidade', icon: Building2, emoji: '🏰' },
  { value: 'pantano', label: 'Pântano', icon: Shrub, emoji: '🐊' },
  { value: 'subterraneo', label: 'Subterrâneo', icon: ArrowDown, emoji: '🕳️' },
  { value: 'personalizado', label: 'Personalizado', icon: MapPin, emoji: '📍' },
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
};

const INTENSITY_LABEL: Record<Intensity, string> = { leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso' };

// Weather probabilities per region (weights)
const WEATHER_PROBABILITIES: Record<RegionType, Partial<Record<WeatherType, number>>> = {
  floresta: { sol: 25, nublado: 25, chuva: 25, tempestade: 10, neblina: 10, neve: 2, vento_forte: 3 },
  montanha: { sol: 15, nublado: 20, chuva: 15, tempestade: 10, neblina: 10, neve: 15, vento_forte: 15 },
  costa: { sol: 30, nublado: 20, chuva: 20, tempestade: 15, neblina: 5, vento_forte: 10 },
  deserto: { sol: 40, calor_extremo: 30, vento_forte: 15, nublado: 10, tempestade: 5 },
  cidade: { sol: 30, nublado: 30, chuva: 20, tempestade: 5, neblina: 10, neve: 3, vento_forte: 2 },
  pantano: { sol: 10, nublado: 20, chuva: 30, neblina: 25, tempestade: 10, calor_extremo: 5 },
  subterraneo: { nublado: 70, neblina: 25, vento_forte: 5 },
  personalizado: { sol: 25, nublado: 20, chuva: 20, tempestade: 10, neblina: 10, neve: 5, calor_extremo: 5, vento_forte: 5 },
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
};

const ENVIRONMENTAL_EVENTS: Record<RegionType, { weather: WeatherType[]; events: { desc: string; effect: string }[] }[]> = {
  floresta: [
    { weather: ['chuva', 'tempestade'], events: [
      { desc: '🌳 Queda de árvore no caminho', effect: 'Teste DEX CD 13 ou 2d6 de dano' },
      { desc: '🌊 Rio transbordou', effect: 'Terreno difícil, teste FOR CD 12 para atravessar' },
      { desc: '🍄 Esporos liberados pela chuva', effect: 'Teste CON CD 11 ou envenenado por 1 hora' },
    ]},
    { weather: ['neblina'], events: [
      { desc: '👻 Sons estranhos na neblina', effect: 'Teste SAB CD 12 ou assustado por 1 min' },
      { desc: '🕸️ Emboscada de criaturas', effect: 'Surpresa se Percepção passiva < 14' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🦌 Rebanho de animais cruzando', effect: 'Bloqueio do caminho por 10 min' },
      { desc: '🌿 Ervas raras encontradas', effect: 'Teste Natureza CD 13: 1d4 ervas medicinais' },
    ]},
  ],
  montanha: [
    { weather: ['vento_forte', 'tempestade'], events: [
      { desc: '🪨 Risco de avalanche!', effect: 'Teste DEX CD 15 ou 4d6 de dano e soterrado' },
      { desc: '⚡ Raio atinge perto', effect: 'Teste DEX CD 12 ou 2d8 de dano elétrico' },
    ]},
    { weather: ['neve'], events: [
      { desc: '❄️ Caminho congelado', effect: 'Teste Acrobacia CD 13 ou cai, 1d6 dano' },
      { desc: '🐺 Lobos famintos', effect: 'Encontro: 1d4+2 lobos' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🦅 Águia gigante observando', effect: 'Possível montaria ou combate' },
    ]},
  ],
  costa: [
    { weather: ['tempestade', 'vento_forte'], events: [
      { desc: '🌊 Onda gigante!', effect: 'Teste FOR CD 14 ou arrastado 9m, 2d6 dano' },
      { desc: '🚢 Navio naufragado à vista', effect: 'Possível exploração ou salvamento' },
    ]},
    { weather: ['sol', 'nublado', 'chuva'], events: [
      { desc: '🦀 Maré mudou, revelando caverna', effect: 'Acesso a área secreta por 2 horas' },
    ]},
  ],
  deserto: [
    { weather: ['calor_extremo'], events: [
      { desc: '🏜️ Tempestade de areia!', effect: 'Visibilidade 0, teste CON CD 14/rodada ou sufoca' },
      { desc: '💀 Miragem enganosa', effect: 'Teste SAB CD 13 ou perde 1 hora de viagem' },
    ]},
    { weather: ['vento_forte'], events: [
      { desc: '🦂 Escorpiões emergem da areia', effect: 'Encontro: 2d4 escorpiões gigantes' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🏛️ Ruínas parcialmente reveladas', effect: 'Teste Investigação CD 12: tesouro ou armadilha' },
    ]},
  ],
  cidade: [
    { weather: ['chuva', 'tempestade'], events: [
      { desc: '🏚️ Inundação nas ruas baixas', effect: 'Terreno difícil, comércios fechados' },
      { desc: '🐀 Ratos saem dos esgotos', effect: 'Risco de doença, teste CON CD 10' },
    ]},
    { weather: ['sol', 'nublado'], events: [
      { desc: '🎪 Festival de rua!', effect: '+2 em testes sociais, preços 20% menores' },
      { desc: '🗡️ Briga na rua', effect: 'Guardas ocupados, oportunidade ou perigo' },
    ]},
  ],
  pantano: [
    { weather: ['chuva', 'neblina'], events: [
      { desc: '🫧 Gás do pântano!', effect: 'Teste CON CD 13 ou envenenado e confuso por 1 hora' },
      { desc: '🐊 Crocodilo emboscado', effect: 'Surpresa se Percepção passiva < 15' },
    ]},
    { weather: ['sol', 'nublado', 'calor_extremo'], events: [
      { desc: '🦟 Enxame de insetos', effect: '-1 em tudo até descanso, risco de doença' },
    ]},
  ],
  subterraneo: [
    { weather: ['nublado', 'neblina', 'vento_forte'], events: [
      { desc: '🪨 Desmoronamento parcial', effect: 'Teste DEX CD 14 ou 3d6 de dano, caminho bloqueado' },
      { desc: '💧 Infiltração de água', effect: 'Terreno escorregadio, tochas podem apagar' },
      { desc: '🕷️ Teia gigante bloqueia passagem', effect: 'Teste FOR CD 12 para romper ou contornar' },
    ]},
  ],
  personalizado: [
    { weather: ['sol', 'nublado', 'chuva', 'tempestade', 'neblina', 'neve', 'calor_extremo', 'vento_forte'], events: [
      { desc: '⚠️ Evento misterioso', effect: 'O mestre decide o efeito' },
      { desc: '🌀 Anomalia mágica', effect: 'Teste de resistência CD 13 ou efeito aleatório' },
    ]},
  ],
};

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
  // 1-8 game hours in minutes
  return (Math.floor(Math.random() * 8) + 1) * 60;
}

function generateWeather(region: RegionType): WeatherState {
  const type = weightedRandom(WEATHER_PROBABILITIES[region]);
  const intensity = randomIntensity();
  const duration = randomDuration();
  return {
    type,
    intensity,
    durationGameMinutes: duration,
    elapsedGameMinutes: 0,
    effects: WEATHER_EFFECTS[type][intensity],
  };
}

function tryGenerateEvent(region: RegionType, weatherType: WeatherType): { desc: string; effect: string } | null {
  const regionEvents = ENVIRONMENTAL_EVENTS[region];
  const matching = regionEvents.filter(e => e.weather.includes(weatherType));
  if (matching.length === 0) return null;
  const group = matching[Math.floor(Math.random() * matching.length)];
  return group.events[Math.floor(Math.random() * group.events.length)];
}

function getTimeOfDay(gameMinutes: number) {
  const hours = Math.floor((gameMinutes % 1440) / 60);
  if (hours >= 6 && hours < 12) return { label: 'Manhã', icon: Sunrise, emoji: '🌅' };
  if (hours >= 12 && hours < 18) return { label: 'Tarde', icon: Sun, emoji: '☀️' };
  if (hours >= 18 && hours < 21) return { label: 'Anoitecer', icon: Sunset, emoji: '🌇' };
  return { label: 'Noite Profunda', icon: Moon, emoji: '🌙' };
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
};

const Environment = () => {
  const [env, setEnv] = useLocalStorage<EnvironmentState>('arcanum-environment', DEFAULT_ENV);
  const [liveGameMinutes, setLiveGameMinutes] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<{ desc: string; effect: string } | null>(null);

  // Compute live game minutes every second, reading timer state from localStorage
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

  const gameMinutes = liveGameMinutes;
  const timeOfDay = getTimeOfDay(gameMinutes);
  const TimeIcon = timeOfDay.icon;
  const hours = Math.floor((gameMinutes % 1440) / 60);
  const minutes = gameMinutes % 60;
  const days = Math.floor(gameMinutes / 1440);

  // Auto weather change when duration expires
  useEffect(() => {
    if (!env.autoWeather) return;
    if (env.weather.elapsedGameMinutes >= env.weather.durationGameMinutes) {
      const newWeather = generateWeather(env.region);
      setEnv(prev => ({
        ...prev,
        weather: newWeather,
        lastWeatherChangeTimestamp: gameMinutes,
      }));
    }
  }, [env.autoWeather, env.weather.elapsedGameMinutes, env.weather.durationGameMinutes, env.region, gameMinutes, setEnv]);

  // Track weather elapsed time based on timer
  useEffect(() => {
    if (env.lastWeatherChangeTimestamp === 0) {
      setEnv(prev => ({ ...prev, lastWeatherChangeTimestamp: gameMinutes }));
      return;
    }
    const elapsed = gameMinutes - env.lastWeatherChangeTimestamp;
    if (elapsed > 0 && elapsed !== env.weather.elapsedGameMinutes) {
      setEnv(prev => ({
        ...prev,
        weather: { ...prev.weather, elapsedGameMinutes: elapsed },
      }));
    }
  }, [gameMinutes, env.lastWeatherChangeTimestamp, env.weather.elapsedGameMinutes, setEnv]);

  // Auto events every ~2 game hours
  useEffect(() => {
    if (env.eventMode === 'manual') return;
    if (!timerIsRunning) return;
    // Check every game hour
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

  const addEvent = useCallback((event: { desc: string; effect: string }) => {
    setEnv(prev => ({
      ...prev,
      events: [...prev.events.slice(-19), {
        id: crypto.randomUUID(),
        description: event.desc,
        mechanicalEffect: event.effect,
        timestamp: gameMinutes,
      }],
    }));
  }, [setEnv, gameMinutes]);

  const changeRegion = (region: RegionType) => {
    const newWeather = generateWeather(region);
    setEnv(prev => ({
      ...prev,
      region,
      weather: newWeather,
      lastWeatherChangeTimestamp: gameMinutes,
      events: [],
    }));
  };

  const rerollWeather = () => {
    const newWeather = generateWeather(env.region);
    setEnv(prev => ({
      ...prev,
      weather: newWeather,
      lastWeatherChangeTimestamp: gameMinutes,
    }));
  };

  const forceEvent = () => {
    const event = tryGenerateEvent(env.region, env.weather.type);
    if (event) addEvent(event);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Ambiente & Clima</h1>

      {/* Day/Night + Timer sync */}
      <Card className="card-hover border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <RegionIcon className="w-6 h-6 text-primary" />
              <span className="font-semibold">{regionInfo.emoji} {regionInfo.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Region Selection */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Região
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map(r => (
                <Button
                  key={r.value}
                  variant={env.region === r.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => changeRegion(r.value)}
                >
                  <r.icon className="w-4 h-4" />
                  {r.emoji} {r.label}
                </Button>
              ))}
            </div>
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

        {/* Current Weather */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <WeatherIcon className="w-5 h-5 text-primary" /> Clima Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className="text-4xl mb-1">{WEATHER_INFO[env.weather.type].emoji}</p>
              <p className="text-xl font-display font-bold">{WEATHER_INFO[env.weather.type].label}</p>
              <Badge variant="secondary" className="mt-1">
                {INTENSITY_LABEL[env.weather.intensity]}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Duração restante</span>
                <span>{remainingHours}h {remainingMins}min no jogo</span>
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
      </div>

      {/* Settings */}
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

      {/* Pending Event */}
      {pendingEvent && (
        <Card className="border-primary animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">{pendingEvent.desc}</p>
                <p className="text-sm text-muted-foreground">{pendingEvent.effect}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" onClick={() => { addEvent(pendingEvent); setPendingEvent(null); }}>
                  Aceitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingEvent(null)}>
                  Ignorar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" /> Eventos Ambientais
            </CardTitle>
            <Button variant="outline" size="sm" onClick={forceEvent}>
              <Zap className="w-3 h-3 mr-1" /> Gerar Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {env.events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento ocorreu ainda</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...env.events].reverse().map(event => (
                <div key={event.id} className="bg-secondary/50 rounded p-3 border border-border/50">
                  <p className="font-semibold text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.mechanicalEffect}</p>
                  <p className="text-xs text-primary/70 mt-1">
                    ⏱️ {Math.floor(event.timestamp / 1440) > 0 ? `Dia ${Math.floor(event.timestamp / 1440) + 1}, ` : ''}
                    {String(Math.floor((event.timestamp % 1440) / 60)).padStart(2, '0')}:
                    {String(event.timestamp % 60).padStart(2, '0')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Probability Table */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-primary" /> Probabilidades ({regionInfo.label})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
    </div>
  );
};

export default Environment;
