export type SystemGenre = 'medieval' | 'fantasia' | 'urbano' | 'horror' | 'futurista' | 'pirata' | 'custom';

export type SystemTheme = {
  label: string;
  accent: string;
  ink: string;
  paper: string;
  cover: string;
  texture: string;
  frame: 'book' | 'dossier' | 'tech' | 'nautical' | 'clean';
};

export type RuleEntry = { id: string; title: string; body: string };
export type CustomAttribute = { id: string; name: string; short: string; description: string };
export type CustomResource = { id: string; name: string; short: string; maximum: string; tone: 'life' | 'focus' | 'stress' | 'neutral' };
export type CustomSkill = { id: string; name: string; attribute: string; description: string };
export type CustomCondition = { id: string; name: string; effect: string };

export type CustomSystem = {
  id: string;
  name: string;
  tagline: string;
  genre: SystemGenre;
  dice: string;
  resolution: string;
  identity: string;
  attributes: CustomAttribute[];
  resources: CustomResource[];
  skills: CustomSkill[];
  conditions: CustomCondition[];
  rules: RuleEntry[];
  createdAt: string;
  updatedAt: string;
};

export const THEMES: Record<SystemGenre, SystemTheme> = {
  medieval: { label: 'Medieval', accent: '#c89b5d', ink: '#f3e2bd', paper: '#382a1d', cover: 'linear-gradient(135deg,#17120f,#5a3b22 52%,#16110f)', texture: 'repeating-linear-gradient(0deg,rgba(255,220,160,.04) 0 1px,transparent 1px 5px)', frame: 'book' },
  fantasia: { label: 'Fantasia', accent: '#b68cff', ink: '#efe6ff', paper: '#211c34', cover: 'linear-gradient(135deg,#100c22,#513b76 58%,#171126)', texture: 'radial-gradient(circle at 20% 20%,rgba(196,150,255,.15),transparent 28%), repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px)', frame: 'book' },
  urbano: { label: 'Contemporâneo / Urbano', accent: '#5fd4c5', ink: '#e5fffb', paper: '#132020', cover: 'linear-gradient(135deg,#0b1114,#17443f 58%,#10171a)', texture: 'linear-gradient(115deg,transparent 0 44%,rgba(95,212,197,.08) 45% 46%,transparent 47%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 5px)', frame: 'clean' },
  horror: { label: 'Horror / Investigação', accent: '#d27861', ink: '#f1ded6', paper: '#201817', cover: 'linear-gradient(135deg,#0d0d0d,#4c2726 58%,#111010)', texture: 'radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px)', frame: 'dossier' },
  futurista: { label: 'Futurista / Cyber', accent: '#63d7ff', ink: '#dcf7ff', paper: '#101d2a', cover: 'linear-gradient(135deg,#07111c,#123f5d 58%,#0a111b)', texture: 'repeating-linear-gradient(0deg,rgba(99,215,255,.07) 0 1px,transparent 1px 5px)', frame: 'tech' },
  pirata: { label: 'Pirata / Marítimo', accent: '#e4ae62', ink: '#f7e8c5', paper: '#30251b', cover: 'linear-gradient(135deg,#0f171b,#244a55 56%,#172025)', texture: 'linear-gradient(165deg,rgba(228,174,98,.08),transparent 35%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 6px)', frame: 'nautical' },
  custom: { label: 'Personalizado', accent: '#f0a7ff', ink: '#fff1ff', paper: '#211326', cover: 'linear-gradient(135deg,#120b18,#572d5f 58%,#17101d)', texture: 'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px)', frame: 'clean' },
};

const id = () => Math.random().toString(36).slice(2, 10);
export const newSystem = (): CustomSystem => ({
  id: `sys-${id()}`,
  name: 'Meu sistema',
  tagline: 'Um mundo pronto para ser jogado',
  genre: 'medieval',
  dice: 'd20',
  resolution: 'Role o dado, some o modificador e compare com a dificuldade.',
  identity: '',
  attributes: [
    { id: id(), name: 'Atributo principal', short: 'ATR', description: 'O que este valor representa?' },
    { id: id(), name: 'Atributo secundário', short: 'SEC', description: '' },
  ],
  resources: [{ id: id(), name: 'Vida', short: 'PV', maximum: '10', tone: 'life' }],
  skills: [{ id: id(), name: 'Perícia inicial', attribute: 'ATR', description: '' }],
  conditions: [],
  rules: [{ id: id(), title: 'Regra central', body: '' }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const themeFor = (genre: SystemGenre) => THEMES[genre] ?? THEMES.custom;
export const uid = id;
