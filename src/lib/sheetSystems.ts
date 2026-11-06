import type { SheetAttribute, SheetResource, SheetSkill } from './sheets';

const rid = () => Math.random().toString(36).slice(2, 10);

/** Como a ficha se parece em cada sistema. */
export type SheetFrame = 'paranormal' | 'parchment' | 'gothic' | 'neon' | 'horror' | 'punk' | 'heroic';

export interface SheetSystem {
  id: string;
  name: string;
  color: string;           // HSL
  font: 'display' | 'serif' | 'sans' | 'mono';
  frame: SheetFrame;
  attrs: [string, string, number][];          // label, sigla, valor inicial
  resources: [string, string, number, SheetResource['tone']][];
  skills: string[];
  resLabel?: string;       // nome da caixa de perícias
}

export const SHEET_SYSTEMS: SheetSystem[] = [
  {
    id: 'ordemparanormal', name: 'Ordem Paranormal', color: '0 78% 55%', font: 'display', frame: 'paranormal',
    attrs: [['Agilidade', 'AGI', 1], ['Força', 'FOR', 1], ['Intelecto', 'INT', 1], ['Presença', 'PRE', 1], ['Vigor', 'VIG', 1]],
    resources: [['Vida', 'PV', 12, 'life'], ['Sanidade', 'SAN', 12, 'sanity'], ['Esforço', 'PE', 2, 'effort']],
    skills: ['Acrobacia', 'Adestramento', 'Artes', 'Atletismo', 'Atualidades', 'Ciências', 'Crime', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Luta', 'Medicina', 'Ocultismo', 'Percepção', 'Pilotagem', 'Pontaria', 'Profissão', 'Reflexos', 'Religião', 'Sobrevivência', 'Tática', 'Tecnologia', 'Vontade'],
  },
  {
    id: 'ordemparanormal2-alpha', name: 'Ordem Paranormal II — Playtest Alpha', color: '350 82% 58%', font: 'display', frame: 'paranormal',
    attrs: [['Físico', 'FIS', 6], ['Mente', 'MEN', 6], ['Emoção', 'EMO', 6]],
    resources: [['Vida', 'VIDA', 10, 'life'], ['Pontos de Determinação', 'PD', 3, 'effort']],
    skills: ['Acrobacia', 'Aptidão', 'Atletismo', 'Crime', 'Disciplina', 'Enganação', 'Furtividade', 'Intimidar', 'Intuição', 'Luta', 'Máquinas', 'Medicina', 'Ocultismo', 'Percepção', 'Persuasão', 'Pesquisar', 'Pontaria', 'Sobrevivência', 'Tecnologia', 'Vigor'],
  },
  {
    id: 'dnd5e', name: 'D&D 5e', color: '0 65% 42%', font: 'serif', frame: 'parchment',
    attrs: [['Força', 'FOR', 10], ['Destreza', 'DES', 10], ['Constituição', 'CON', 10], ['Inteligência', 'INT', 10], ['Sabedoria', 'SAB', 10], ['Carisma', 'CAR', 10]],
    resources: [['Pontos de Vida', 'PV', 10, 'life'], ['Classe de Armadura', 'CA', 10, 'neutral'], ['Dados de Vida', 'DV', 1, 'effort']],
    skills: ['Acrobacia', 'Adestrar Animais', 'Arcanismo', 'Atletismo', 'Atuação', 'Enganação', 'Furtividade', 'História', 'Intimidação', 'Intuição', 'Investigação', 'Medicina', 'Natureza', 'Percepção', 'Persuasão', 'Prestidigitação', 'Religião', 'Sobrevivência'],
  },
  {
    id: 'tormenta20', name: 'Tormenta 20', color: '355 80% 48%', font: 'display', frame: 'heroic',
    attrs: [['Força', 'FOR', 0], ['Destreza', 'DES', 0], ['Constituição', 'CON', 0], ['Inteligência', 'INT', 0], ['Sabedoria', 'SAB', 0], ['Carisma', 'CAR', 0]],
    resources: [['Pontos de Vida', 'PV', 16, 'life'], ['Pontos de Mana', 'PM', 4, 'sanity'], ['Defesa', 'DEF', 10, 'neutral']],
    skills: ['Acrobacia', 'Adestramento', 'Atletismo', 'Atuação', 'Cavalgar', 'Conhecimento', 'Cura', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Guerra', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Jogatina', 'Ladinagem', 'Luta', 'Misticismo', 'Nobreza', 'Ofício', 'Percepção', 'Pilotagem', 'Pontaria', 'Reflexos', 'Religião', 'Sobrevivência', 'Vontade'],
  },
  {
    id: 'pf2e', name: 'Pathfinder 2e', color: '38 80% 50%', font: 'serif', frame: 'parchment',
    attrs: [['Força', 'FOR', 0], ['Destreza', 'DES', 0], ['Constituição', 'CON', 0], ['Inteligência', 'INT', 0], ['Sabedoria', 'SAB', 0], ['Carisma', 'CAR', 0]],
    resources: [['Pontos de Vida', 'PV', 18, 'life'], ['Classe de Armadura', 'CA', 15, 'neutral'], ['Pontos de Heroísmo', 'PH', 1, 'effort']],
    skills: ['Acrobacia', 'Arcanismo', 'Atletismo', 'Diplomacia', 'Dissimulação', 'Furtividade', 'Intimidação', 'Ladroagem', 'Medicina', 'Natureza', 'Ocultismo', 'Performance', 'Religião', 'Saber', 'Sociedade', 'Sobrevivência', 'Manufatura'],
  },
  {
    id: 'cthulhu', name: 'Call of Cthulhu 7e', color: '150 35% 40%', font: 'serif', frame: 'horror',
    attrs: [['Força', 'FOR', 50], ['Constituição', 'CON', 50], ['Tamanho', 'TAM', 50], ['Destreza', 'DES', 50], ['Aparência', 'APA', 50], ['Inteligência', 'INT', 50], ['Poder', 'POD', 50], ['Educação', 'EDU', 50]],
    resources: [['Pontos de Vida', 'PV', 10, 'life'], ['Sanidade', 'SAN', 50, 'sanity'], ['Pontos de Magia', 'PM', 10, 'effort'], ['Sorte', 'SOR', 50, 'neutral']],
    skills: ['Antropologia', 'Arqueologia', 'Arremessar', 'Charme', 'Chaveiro', 'Contabilidade', 'Direito', 'Disfarce', 'Encontrar', 'Escutar', 'Esquivar', 'Furtividade', 'História', 'Intimidação', 'Lábia', 'Lutar', 'Medicina', 'Mitos de Cthulhu', 'Ocultismo', 'Persuasão', 'Primeiros Socorros', 'Psicologia', 'Usar Bibliotecas', 'Armas de Fogo'],
  },
  {
    id: 'vtm5', name: 'Vampiro: A Máscara 5e', color: '345 75% 38%', font: 'serif', frame: 'gothic',
    attrs: [['Força', 'FOR', 1], ['Destreza', 'DES', 1], ['Vigor', 'VIG', 1], ['Carisma', 'CAR', 1], ['Manipulação', 'MAN', 1], ['Autocontrole', 'AUT', 1], ['Inteligência', 'INT', 1], ['Raciocínio', 'RAC', 1], ['Determinação', 'DET', 1]],
    resources: [['Vitalidade', 'VIT', 4, 'life'], ['Força de Vontade', 'FV', 3, 'sanity'], ['Fome', 'FOM', 5, 'effort'], ['Humanidade', 'HUM', 7, 'neutral']],
    skills: ['Armas Brancas', 'Armas de Fogo', 'Atletismo', 'Briga', 'Condução', 'Furtividade', 'Ladroagem', 'Ofícios', 'Sobrevivência', 'Empatia com Animais', 'Etiqueta', 'Intimidação', 'Liderança', 'Manha', 'Performance', 'Persuasão', 'Sagacidade', 'Subterfúgio', 'Ciência', 'Erudição', 'Finanças', 'Investigação', 'Medicina', 'Ocultismo', 'Percepção', 'Política', 'Tecnologia'],
  },
  {
    id: 'cpred', name: 'Cyberpunk RED', color: '185 95% 50%', font: 'mono', frame: 'neon',
    attrs: [['Inteligência', 'INT', 5], ['Reflexos', 'REF', 5], ['Destreza', 'DES', 5], ['Técnica', 'TEC', 5], ['Frieza', 'FRI', 5], ['Vontade', 'VON', 5], ['Sorte', 'SOR', 5], ['Movimento', 'MOV', 5], ['Corpo', 'COR', 5], ['Empatia', 'EMP', 5]],
    resources: [['Pontos de Vida', 'PV', 35, 'life'], ['Humanidade', 'HUM', 50, 'sanity'], ['Blindagem', 'SP', 11, 'neutral']],
    skills: ['Atletismo', 'Briga', 'Concentração', 'Conduzir Veículo', 'Educação', 'Esquiva', 'Furtividade', 'Interface', 'Lábia', 'Percepção', 'Persuasão', 'Pistolas', 'Primeiros Socorros', 'Rifles', 'Tecnologia Básica', 'Armas Brancas', 'Streetwise', 'Tecnologia Cyber'],
  },
  {
    id: 'morkborg', name: 'Mörk Borg', color: '55 100% 55%', font: 'display', frame: 'punk',
    attrs: [['Agilidade', 'AGI', 0], ['Presença', 'PRE', 0], ['Força', 'FOR', 0], ['Resistência', 'RES', 0]],
    resources: [['Pontos de Vida', 'PV', 8, 'life'], ['Ômens', 'OMN', 2, 'effort'], ['Prata', '$', 30, 'neutral']],
    skills: [],
  },
  {
    id: '3det', name: '3D&T Alpha', color: '25 95% 55%', font: 'sans', frame: 'heroic',
    attrs: [['Força', 'F', 1], ['Habilidade', 'H', 1], ['Resistência', 'R', 1], ['Armadura', 'A', 1], ['Poder de Fogo', 'PdF', 1]],
    resources: [['Pontos de Vida', 'PV', 5, 'life'], ['Pontos de Magia', 'PM', 5, 'sanity'], ['Pontos de Experiência', 'XP', 0, 'neutral']],
    skills: ['Animais', 'Arte', 'Ciência', 'Crime', 'Esporte', 'Idiomas', 'Investigação', 'Máquinas', 'Manipulação', 'Medicina', 'Sobrevivência'],
  },
  {
    id: 'savageworlds', name: 'Savage Worlds', color: '28 70% 45%', font: 'display', frame: 'heroic',
    attrs: [['Agilidade', 'AGI', 4], ['Astúcia', 'AST', 4], ['Espírito', 'ESP', 4], ['Força', 'FOR', 4], ['Vigor', 'VIG', 4]],
    resources: [['Ferimentos', 'FER', 3, 'life'], ['Fadiga', 'FAD', 2, 'sanity'], ['Benes', 'BEN', 3, 'effort']],
    skills: ['Atletismo', 'Conhecimento Geral', 'Furtividade', 'Lutar', 'Notar', 'Persuadir', 'Atirar', 'Intimidar', 'Provocar', 'Curar', 'Sobrevivência', 'Pesquisa'],
  },
  {
    id: 'shadowrun5', name: 'Shadowrun 5e', color: '120 80% 45%', font: 'mono', frame: 'neon',
    attrs: [['Corpo', 'COR', 3], ['Agilidade', 'AGI', 3], ['Reação', 'REA', 3], ['Força', 'FOR', 3], ['Vontade', 'VON', 3], ['Lógica', 'LOG', 3], ['Intuição', 'INT', 3], ['Carisma', 'CAR', 3], ['Essência', 'ESS', 6]],
    resources: [['Monitor Físico', 'FÍS', 10, 'life'], ['Monitor Atordoamento', 'ATO', 10, 'sanity'], ['Edge', 'EDG', 3, 'effort']],
    skills: ['Armas Automáticas', 'Pistolas', 'Combate Desarmado', 'Lâminas', 'Furtividade', 'Percepção', 'Hacking', 'Cibercombate', 'Eletrônicos', 'Conjuração', 'Feitiçaria', 'Etiqueta', 'Negociação', 'Liderança', 'Primeiros Socorros', 'Pilotar Terrestre'],
  },
  {
    id: 'custom', name: 'Livre (personalizado)', color: '43 90% 55%', font: 'display', frame: 'paranormal',
    attrs: [['Atributo 1', 'AT1', 1], ['Atributo 2', 'AT2', 1], ['Atributo 3', 'AT3', 1], ['Atributo 4', 'AT4', 1]],
    resources: [['Vida', 'PV', 10, 'life']],
    skills: [],
  },
];

export const getSystem = (id?: string) => SHEET_SYSTEMS.find(s => s.id === id) ?? SHEET_SYSTEMS[0];

export const systemTemplate = (id: string): { attributes: SheetAttribute[]; resources: SheetResource[]; skills: SheetSkill[] } => {
  const s = getSystem(id);
  return {
    attributes: s.attrs.map(([label, short, value]) => ({ id: rid(), label, short, value })),
    resources: s.resources.map(([label, short, max, tone]) => ({ id: rid(), label, short, current: max, max, tone })),
    skills: s.skills.map(name => ({ id: rid(), name, value: 0, trained: false })),
  };
};
