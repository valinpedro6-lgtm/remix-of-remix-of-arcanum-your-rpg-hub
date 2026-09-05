// System-accurate flavor data for the NPC/character generator.
// Each RPG system has its own vocabulary (race vs ancestry vs clan vs metatype),
// its own class list and its own attribute scale.

export type AttrScale = 'd20' | 'percentile' | 'dots5' | 'die' | 'gurps' | 'pool6' | 'cp' | 'fate' | 'mork' | 'dots3';

export interface SystemFlavor {
  /** matches PlayerPreset.system */
  system: string;
  originLabel: string;      // "Raça", "Ancestralidade", "Clã", "Origem"...
  origins: string[];
  classLabel: string;       // "Classe", "Ocupação", "Trilha", "Papel"...
  classes: string[];
  /** Optional third trait shown as extra badge, e.g. NEX, Geração, Conceito */
  extraLabel?: string;
  extras?: string[];
  scale: AttrScale;
  /** true when region-based fantasy flavor (races/occupations) also applies */
  fantasy: boolean;
  defenseLabel: string;
  hpLabel: string;
}

export const SYSTEM_FLAVORS: SystemFlavor[] = [
  {
    system: 'dnd5e',
    originLabel: 'Raça',
    origins: ['Humano', 'Elfo Alto', 'Elfo da Floresta', 'Drow', 'Anão da Montanha', 'Anão da Colina', 'Halfling Pés-Leves', 'Halfling Robusto', 'Meio-Elfo', 'Meio-Orc', 'Tiefling', 'Draconato', 'Gnomo das Rochas', 'Gnomo da Floresta', 'Aasimar', 'Golias', 'Tabaxi', 'Firbolg', 'Genasi'],
    classLabel: 'Classe',
    classes: ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro', 'Artífice', 'Plebeu'],
    extraLabel: 'Antecedente',
    extras: ['Acólito', 'Artesão de Guilda', 'Charlatão', 'Criminoso', 'Eremita', 'Forasteiro', 'Herói do Povo', 'Marinheiro', 'Nobre', 'Órfão', 'Sábio', 'Soldado'],
    scale: 'd20', fantasy: true, defenseLabel: 'CA', hpLabel: 'PV',
  },
  {
    system: 'tormenta20',
    originLabel: 'Raça',
    origins: ['Humano', 'Anão', 'Dahllan', 'Elfo', 'Goblin', 'Lefou', 'Minotauro', 'Qareen', 'Golem', 'Hynne', 'Kliren', 'Medusa', 'Osteon', 'Sereia/Tritão', 'Silfide', 'Suraggel', 'Trog'],
    classLabel: 'Classe',
    classes: ['Arcanista', 'Bárbaro', 'Bardo', 'Bucaneiro', 'Caçador', 'Cavaleiro', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Ladino', 'Lutador', 'Nobre', 'Paladino'],
    extraLabel: 'Origem',
    extras: ['Acólito', 'Amnésico', 'Aristocrata', 'Artista', 'Assistente de Laboratório', 'Batedor', 'Capanga', 'Charlatão', 'Circense', 'Curandeiro', 'Eremita', 'Escravo', 'Estudioso', 'Fazendeiro', 'Gladiador', 'Herdeiro', 'Mercador', 'Minerador', 'Nômade', 'Pivete', 'Refugiado', 'Selvagem', 'Soldado', 'Taverneiro'],
    scale: 'd20', fantasy: true, defenseLabel: 'Defesa', hpLabel: 'PV',
  },
  {
    system: 'pf2e',
    originLabel: 'Ancestralidade',
    origins: ['Humano', 'Anão', 'Elfo', 'Gnomo', 'Goblin', 'Halfling', 'Meio-Elfo', 'Meio-Orc', 'Leshy', 'Orc', 'Catfolk', 'Kobold', 'Ratfolk', 'Tengu', 'Lagarto (Iruxi)'],
    classLabel: 'Classe',
    classes: ['Alquimista', 'Bárbaro', 'Bardo', 'Bruxa', 'Campeão', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Investigador', 'Ladino', 'Mago', 'Monge', 'Oráculo', 'Patrulheiro', 'Psíquico', 'Comandante'],
    extraLabel: 'Antecedente',
    extras: ['Acólito', 'Animal Whisperer', 'Artesão', 'Barkeep', 'Caçador', 'Detetive', 'Erudito', 'Guarda', 'Marinheiro', 'Nobre', 'Órfão', 'Batedor'],
    scale: 'd20', fantasy: true, defenseLabel: 'CA', hpLabel: 'PV',
  },
  {
    system: 'ordemparanormal',
    originLabel: 'Origem',
    origins: ['Acadêmico', 'Agente de Saúde', 'Amnésico', 'Artista', 'Atleta', 'Chef', 'Criminoso', 'Cultista Arrependido', 'Desgarrado', 'Engenheiro', 'Executivo', 'Investigador', 'Lutador', 'Magnata', 'Máquina', 'Mercenário', 'Militar', 'Motorista', 'Operário', 'Policial', 'Religioso', 'Servidor Público', 'T.I.', 'Teórico da Conspiração', 'Trabalhador Rural', 'Trambiqueiro', 'Universitário', 'Vítima'],
    classLabel: 'Classe',
    classes: ['Combatente', 'Especialista', 'Ocultista'],
    extraLabel: 'Trilha / Elemento',
    extras: ['Aniquilador (Sangue)', 'Comandante de Campo', 'Guerreiro (Morte)', 'Operações Especiais', 'Tropa de Choque', 'Atirador de Elite', 'Infiltrador', 'Médico de Campo', 'Negociador', 'Técnico', 'Conduíte (Energia)', 'Flagelador (Sangue)', 'Graduado', 'Intuitivo (Conhecimento)', 'Lâmina Paranormal', 'Devoto do Medo'],
    scale: 'dots5', fantasy: false, defenseLabel: 'Defesa', hpLabel: 'PV',
  },
  {
    system: 'cthulhu',
    originLabel: 'Nacionalidade',
    origins: ['Norte-americano', 'Britânico', 'Irlandês', 'Francês', 'Alemão', 'Italiano', 'Brasileiro', 'Egípcio', 'Chinês', 'Indiano', 'Russo', 'Australiano'],
    classLabel: 'Ocupação',
    classes: ['Antiquário', 'Autor', 'Detetive Particular', 'Jornalista', 'Médico', 'Professor', 'Policial', 'Ocultista', 'Missionário', 'Advogado', 'Arqueólogo', 'Contador', 'Fazendeiro', 'Piloto', 'Gângster', 'Enfermeira', 'Bibliotecário', 'Parapsicólogo'],
    extraLabel: 'Sanidade',
    scale: 'percentile', fantasy: false, defenseLabel: 'Esquiva', hpLabel: 'PV',
  },
  {
    system: 'vtm5',
    originLabel: 'Clã',
    origins: ['Brujah', 'Gangrel', 'Malkaviano', 'Nosferatu', 'Toreador', 'Tremere', 'Ventrue', 'Lasombra', 'Tzimisce', 'Banu Haqim', 'Ministério', 'Ravnos', 'Salubri', 'Caitiff', 'Sangue Ralo'],
    classLabel: 'Conceito',
    classes: ['Executor da Camarilla', 'Anarquista de Rua', 'Investigador Noturno', 'Artista Decadente', 'Traficante de Informação', 'Sedutor', 'Erudito Oculto', 'Caçador de Renegados', 'Barão Local', 'Marginal'],
    extraLabel: 'Predador',
    extras: ['Alleycat', 'Bagger', 'Cleaver', 'Consensualista', 'Farmer', 'Osiris', 'Sandman', 'Scene Queen', 'Siren', 'Extorsionário'],
    scale: 'dots5', fantasy: false, defenseLabel: 'Defesa', hpLabel: 'Vitalidade',
  },
  {
    system: 'shadowrun5',
    originLabel: 'Metatipo',
    origins: ['Humano', 'Elfo', 'Anão', 'Ork', 'Troll'],
    classLabel: 'Papel',
    classes: ['Street Samurai', 'Decker', 'Rigger', 'Mago de Combate', 'Xamã', 'Adepto Físico', 'Face', 'Infiltrador', 'Técnico', 'Mercenário'],
    extraLabel: 'Contato',
    extras: ['Fixer', 'Talismonger', 'Doutor de Rua', 'Contato Corporativo', 'Informante Policial', 'Contrabandista'],
    scale: 'pool6', fantasy: false, defenseLabel: 'Armadura', hpLabel: 'Condição',
  },
  {
    system: 'cpred',
    originLabel: 'Origem Cultural',
    origins: ['Night City', 'Norte-americano', 'Latino-americano', 'Brasileiro', 'Europeu Central', 'Sudeste Asiático', 'Japonês', 'Africano', 'Oriente Médio', 'Nômade das Estradas'],
    classLabel: 'Papel',
    classes: ['Solo', 'Netrunner', 'Techie', 'Medtech', 'Media', 'Exec', 'Lawman', 'Fixer', 'Nomad', 'Rockerboy'],
    extraLabel: 'Cyberware',
    extras: ['Cyberolhos Kiroshi', 'Braço Gorila', 'Sandevistan', 'Interface Neural', 'Pele Blindada', 'Mantis Blades', 'Airhypo Subdérmico'],
    scale: 'cp', fantasy: false, defenseLabel: 'Armadura', hpLabel: 'PV',
  },
  {
    system: 'savageworlds',
    originLabel: 'Ancestralidade',
    origins: ['Humano', 'Elfo', 'Anão', 'Meio-Elfo', 'Meio-Folk', 'Saurian', 'Rakashan', 'Andróide', 'Aquariano', 'Avion'],
    classLabel: 'Conceito',
    classes: ['Pistoleiro', 'Batedor', 'Bruxo Errante', 'Soldado', 'Detetive', 'Piloto', 'Explorador', 'Curandeiro', 'Vigarista', 'Caçador de Recompensas'],
    extraLabel: 'Complicação',
    extras: ['Código de Honra', 'Azarado', 'Teimoso', 'Curioso', 'Ganancioso', 'Leal', 'Vingativo', 'Cauteloso'],
    scale: 'die', fantasy: true, defenseLabel: 'Aparar', hpLabel: 'Resistência',
  },
  {
    system: 'gurps',
    originLabel: 'Origem',
    origins: ['Humano Comum', 'Nobre', 'Camponês', 'Cidadão Urbano', 'Nômade', 'Estrangeiro', 'Militar de Carreira', 'Acadêmico'],
    classLabel: 'Modelo',
    classes: ['Combatente', 'Especialista', 'Erudito', 'Diplomata', 'Explorador', 'Ladrão', 'Curandeiro', 'Artesão'],
    extraLabel: 'Vantagem',
    extras: ['Reflexos de Combate', 'Sorte', 'Contatos', 'Riqueza', 'Sentidos Aguçados', 'Resistência a Dor'],
    scale: 'gurps', fantasy: false, defenseLabel: 'Esquiva', hpLabel: 'PV',
  },
  {
    system: 'fate',
    originLabel: 'Conceito Principal',
    origins: ['Detetive Cansado', 'Feiticeiro Relutante', 'Piloto Temerário', 'Diplomata Exilado', 'Mecânico Genial', 'Caçadora de Relíquias', 'Soldado Aposentado', 'Repórter Intrometido'],
    classLabel: 'Dificuldade',
    classes: ['Devo tudo à máfia', 'Não sei dizer não', 'Minha fama me persegue', 'Curiosidade fatal', 'Lealdade cega', 'Passado apagado'],
    extraLabel: 'Aspecto',
    extras: ['Sempre tenho um plano B', 'Conheço todo mundo na cidade', 'Mãos rápidas, boca mais rápida', 'A sorte me deve favores'],
    scale: 'fate', fantasy: false, defenseLabel: 'Defesa', hpLabel: 'Estresse',
  },
  {
    system: 'morkborg',
    originLabel: 'Classe Opcional',
    origins: ['Sem classe (Vagabundo)', 'Cavaleiro Encrenqueiro', 'Herege Esquecido', 'Cultista Faminto', 'Ocultista Pálido', 'Bárbaro Esgotado', 'Ladrão Enfermo'],
    classLabel: 'Ofício',
    classes: ['Mendigo', 'Coveiro', 'Saqueador de Tumbas', 'Pregador Louco', 'Carrasco', 'Curandeiro Charlatão'],
    extraLabel: 'Presságio',
    extras: ['O sol não nascerá amanhã', 'Vermes sob a pele', 'Ouviu a Basilisca', 'Marcado pelo Fogo Negro'],
    scale: 'mork', fantasy: true, defenseLabel: 'Armadura', hpLabel: 'PV',
  },
  {
    system: 'blades',
    originLabel: 'Herança',
    origins: ['Akoros', 'Tycheros', 'Skovlan', 'Iruvian', 'Severos', 'A Ilha Sombria'],
    classLabel: 'Playbook',
    classes: ['Cutter', 'Hound', 'Leech', 'Lurk', 'Slide', 'Spider', 'Whisper'],
    extraLabel: 'Vício',
    extras: ['Fé', 'Jogatina', 'Luxúria', 'Obrigação', 'Prazer', 'Estupefacientes', 'Estranheza'],
    scale: 'dots3', fantasy: false, defenseLabel: 'Resistência', hpLabel: 'Trauma',
  },
  {
    system: 'dungeonworld',
    originLabel: 'Raça',
    origins: ['Humano', 'Elfo', 'Anão', 'Halfling', 'Meio-Orc'],
    classLabel: 'Classe',
    classes: ['Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Ladrão', 'Mago', 'Paladino', 'Patrulheiro'],
    extraLabel: 'Vínculo',
    extras: ['Salvei sua vida uma vez', 'Não confio nele', 'Devo-lhe dinheiro', 'Somos do mesmo vilarejo'],
    scale: 'd20', fantasy: true, defenseLabel: 'Armadura', hpLabel: 'PV',
  },
  {
    system: '3det',
    originLabel: 'Arquétipo',
    origins: ['Humano', 'Andróide', 'Alienígena', 'Construto', 'Mutante', 'Semi-Deus', 'Espírito'],
    classLabel: 'Conceito',
    classes: ['Lutador', 'Mago', 'Atirador', 'Piloto', 'Detetive', 'Herói Mascarado', 'Samurai', 'Cientista'],
    extraLabel: 'Vantagem',
    extras: ['Ataque Especial', 'Aliado', 'Arena', 'Genialidade', 'Patrono', 'Torcida'],
    scale: 'dots5', fantasy: false, defenseLabel: 'Armadura', hpLabel: 'PV',
  },
];

export const getFlavor = (system: string): SystemFlavor =>
  SYSTEM_FLAVORS.find(f => f.system === system) || SYSTEM_FLAVORS[0];

const d = (sides: number) => Math.floor(Math.random() * sides) + 1;

/** Rolls one attribute value + its modifier using the system's own scale. */
export function rollAttribute(scale: AttrScale): { value: number; modifier: number } {
  switch (scale) {
    case 'percentile': {
      const v = (d(6) + d(6) + d(6)) * 5;
      return { value: v, modifier: Math.floor(v / 5) };
    }
    case 'dots5': {
      const v = 1 + Math.floor(Math.random() * 4); // 1-4 dots (5 é excepcional)
      return { value: v, modifier: v };
    }
    case 'dots3': {
      const v = Math.random() < 0.4 ? 0 : 1 + Math.floor(Math.random() * 3);
      return { value: v, modifier: v };
    }
    case 'die': {
      const steps = [4, 6, 6, 8, 8, 10, 12];
      const v = steps[Math.floor(Math.random() * steps.length)];
      return { value: v, modifier: Math.floor(v / 2) - 2 };
    }
    case 'gurps': {
      const v = 8 + Math.floor(Math.random() * 7); // 8-14
      return { value: v, modifier: v - 10 };
    }
    case 'pool6': {
      const v = 1 + Math.floor(Math.random() * 6);
      return { value: v, modifier: v };
    }
    case 'cp': {
      const v = 2 + Math.floor(Math.random() * 7); // 2-8
      return { value: v, modifier: v };
    }
    case 'fate': {
      const v = Math.floor(Math.random() * 5); // 0-4
      return { value: v, modifier: v };
    }
    case 'mork': {
      const v = -3 + Math.floor(Math.random() * 7); // -3..+3
      return { value: v, modifier: v };
    }
    case 'd20':
    default: {
      const rolls = [d(6), d(6), d(6), d(6)].sort((a, b) => b - a).slice(0, 3);
      const v = rolls.reduce((a, b) => a + b, 0);
      return { value: v, modifier: Math.floor((v - 10) / 2) };
    }
  }
}

/** Suggested HP / Defense per system scale. */
export function rollVitals(scale: AttrScale, villain: boolean) {
  const boost = villain ? 2 : 1;
  switch (scale) {
    case 'percentile': return { hp: (8 + d(6)) * boost, ac: 25 + d(20) };
    case 'dots5': return { hp: (12 + d(8) * 2) * boost, ac: 10 + d(6) + (villain ? 5 : 0) };
    case 'dots3': return { hp: 3 * boost, ac: 1 + d(3) };
    case 'die': return { hp: (5 + d(4)) * boost, ac: 4 + d(4) };
    case 'gurps': return { hp: (9 + d(4)) * boost, ac: 8 + d(4) };
    case 'pool6': return { hp: (8 + d(4)) * boost, ac: 4 + d(8) };
    case 'cp': return { hp: (25 + d(20)) * boost, ac: 7 + d(11) };
    case 'fate': return { hp: 3 + (villain ? 3 : 0), ac: 2 + d(3) };
    case 'mork': return { hp: d(8) * boost, ac: d(4) };
    case 'd20':
    default: return { hp: (d(10) + d(10) + 4) * boost, ac: 10 + d(6) + (villain ? 4 : 0) };
  }
}
