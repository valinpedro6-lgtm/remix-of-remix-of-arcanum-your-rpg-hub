// RPG System preset templates for Players and Monsters

export interface PlayerPreset {
  id: string;
  name: string;
  system: string;
  attributes: { name: string }[];
  skills: { name: string; attribute: string }[];
  combatFields: { hp: boolean; mana: boolean; energy: boolean; ca: boolean; movement: boolean };
  hasInventory: boolean;
  hasAbilities: boolean;
  hasNotes: boolean;
}

export interface MonsterPreset {
  id: string;
  name: string;
  system: string;
  attributes: { name: string }[];
  combatFields: { hp: boolean; ca: boolean; movement: boolean };
  sections: { skills: boolean; attacks: boolean; abilities: boolean; resistances: boolean; immunities: boolean; senses: boolean; languages: boolean; inventory: boolean; notes: boolean };
}

export const PLAYER_SYSTEM_PRESETS: PlayerPreset[] = [
  {
    id: 'preset-dnd5e',
    name: 'D&D 5e',
    system: 'dnd5e',
    attributes: [
      { name: 'Força' }, { name: 'Destreza' }, { name: 'Constituição' },
      { name: 'Inteligência' }, { name: 'Sabedoria' }, { name: 'Carisma' },
    ],
    skills: [
      { name: 'Acrobacia', attribute: 'Destreza' },
      { name: 'Adestrar Animais', attribute: 'Sabedoria' },
      { name: 'Arcanismo', attribute: 'Inteligência' },
      { name: 'Atletismo', attribute: 'Força' },
      { name: 'Atuação', attribute: 'Carisma' },
      { name: 'Enganação', attribute: 'Carisma' },
      { name: 'Furtividade', attribute: 'Destreza' },
      { name: 'História', attribute: 'Inteligência' },
      { name: 'Intimidação', attribute: 'Carisma' },
      { name: 'Investigação', attribute: 'Inteligência' },
      { name: 'Medicina', attribute: 'Sabedoria' },
      { name: 'Natureza', attribute: 'Inteligência' },
      { name: 'Percepção', attribute: 'Sabedoria' },
      { name: 'Perspicácia', attribute: 'Sabedoria' },
      { name: 'Persuasão', attribute: 'Carisma' },
      { name: 'Prestidigitação', attribute: 'Destreza' },
      { name: 'Religião', attribute: 'Inteligência' },
      { name: 'Sobrevivência', attribute: 'Sabedoria' },
    ],
    combatFields: { hp: true, mana: false, energy: false, ca: true, movement: true },
    hasInventory: true, hasAbilities: true, hasNotes: true,
  },
  {
    id: 'preset-tormenta20',
    name: 'Tormenta 20',
    system: 'tormenta20',
    attributes: [
      { name: 'Força' }, { name: 'Destreza' }, { name: 'Constituição' },
      { name: 'Inteligência' }, { name: 'Sabedoria' }, { name: 'Carisma' },
    ],
    skills: [
      { name: 'Acrobacia', attribute: 'Destreza' },
      { name: 'Adestramento', attribute: 'Carisma' },
      { name: 'Atletismo', attribute: 'Força' },
      { name: 'Atuação', attribute: 'Carisma' },
      { name: 'Cavalgar', attribute: 'Destreza' },
      { name: 'Conhecimento', attribute: 'Inteligência' },
      { name: 'Cura', attribute: 'Sabedoria' },
      { name: 'Diplomacia', attribute: 'Carisma' },
      { name: 'Enganação', attribute: 'Carisma' },
      { name: 'Fortitude', attribute: 'Constituição' },
      { name: 'Furtividade', attribute: 'Destreza' },
      { name: 'Guerra', attribute: 'Inteligência' },
      { name: 'Iniciativa', attribute: 'Destreza' },
      { name: 'Intimidação', attribute: 'Carisma' },
      { name: 'Intuição', attribute: 'Sabedoria' },
      { name: 'Investigação', attribute: 'Inteligência' },
      { name: 'Jogatina', attribute: 'Carisma' },
      { name: 'Ladinagem', attribute: 'Destreza' },
      { name: 'Luta', attribute: 'Força' },
      { name: 'Misticismo', attribute: 'Inteligência' },
      { name: 'Nobreza', attribute: 'Inteligência' },
      { name: 'Ofício', attribute: 'Inteligência' },
      { name: 'Percepção', attribute: 'Sabedoria' },
      { name: 'Pilotagem', attribute: 'Destreza' },
      { name: 'Pontaria', attribute: 'Destreza' },
      { name: 'Reflexos', attribute: 'Destreza' },
      { name: 'Religião', attribute: 'Sabedoria' },
      { name: 'Sobrevivência', attribute: 'Sabedoria' },
      { name: 'Vontade', attribute: 'Sabedoria' },
    ],
    combatFields: { hp: true, mana: true, energy: false, ca: true, movement: true },
    hasInventory: true, hasAbilities: true, hasNotes: true,
  },
  {
    id: 'preset-cthulhu',
    name: 'Call of Cthulhu 7e',
    system: 'cthulhu',
    attributes: [
      { name: 'FOR' }, { name: 'CON' }, { name: 'TAM' },
      { name: 'DES' }, { name: 'APA' }, { name: 'INT' },
      { name: 'POD' }, { name: 'EDU' }, { name: 'Sorte' },
    ],
    skills: [
      { name: 'Antropologia', attribute: 'EDU' },
      { name: 'Arqueologia', attribute: 'EDU' },
      { name: 'Arremessar', attribute: 'DES' },
      { name: 'Armas de Fogo (Pistola)', attribute: 'DES' },
      { name: 'Armas de Fogo (Rifle)', attribute: 'DES' },
      { name: 'Briga', attribute: 'FOR' },
      { name: 'Charme', attribute: 'APA' },
      { name: 'Ciências (Biologia)', attribute: 'EDU' },
      { name: 'Ciências (Química)', attribute: 'EDU' },
      { name: 'Dirigir Auto', attribute: 'DES' },
      { name: 'Disfarce', attribute: 'APA' },
      { name: 'Encontrar', attribute: 'INT' },
      { name: 'Escutar', attribute: 'INT' },
      { name: 'Esquivar', attribute: 'DES' },
      { name: 'Furtividade', attribute: 'DES' },
      { name: 'Intimidação', attribute: 'POD' },
      { name: 'Lábia', attribute: 'APA' },
      { name: 'Medicina', attribute: 'EDU' },
      { name: 'Mitos de Cthulhu', attribute: 'EDU' },
      { name: 'Ocultismo', attribute: 'EDU' },
      { name: 'Persuasão', attribute: 'APA' },
      { name: 'Primeiros Socorros', attribute: 'EDU' },
      { name: 'Psicologia', attribute: 'INT' },
      { name: 'Saltar', attribute: 'DES' },
      { name: 'Trepar', attribute: 'DES' },
    ],
    combatFields: { hp: true, mana: true, energy: false, ca: false, movement: true },
    hasInventory: true, hasAbilities: true, hasNotes: true,
  },
  {
    id: 'preset-op',
    name: 'Ordem Paranormal',
    system: 'ordemparanormal',
    attributes: [
      { name: 'Agilidade' }, { name: 'Força' }, { name: 'Intelecto' },
      { name: 'Presença' }, { name: 'Vigor' },
    ],
    skills: [
      { name: 'Acrobacia', attribute: 'Agilidade' },
      { name: 'Adestramento', attribute: 'Presença' },
      { name: 'Artes', attribute: 'Presença' },
      { name: 'Atletismo', attribute: 'Força' },
      { name: 'Atualidades', attribute: 'Intelecto' },
      { name: 'Ciências', attribute: 'Intelecto' },
      { name: 'Crime', attribute: 'Agilidade' },
      { name: 'Diplomacia', attribute: 'Presença' },
      { name: 'Enganação', attribute: 'Presença' },
      { name: 'Fortitude', attribute: 'Vigor' },
      { name: 'Furtividade', attribute: 'Agilidade' },
      { name: 'Iniciativa', attribute: 'Agilidade' },
      { name: 'Intimidação', attribute: 'Presença' },
      { name: 'Intuição', attribute: 'Presença' },
      { name: 'Investigação', attribute: 'Intelecto' },
      { name: 'Luta', attribute: 'Força' },
      { name: 'Medicina', attribute: 'Intelecto' },
      { name: 'Ocultismo', attribute: 'Intelecto' },
      { name: 'Percepção', attribute: 'Presença' },
      { name: 'Pilotagem', attribute: 'Agilidade' },
      { name: 'Pontaria', attribute: 'Agilidade' },
      { name: 'Profissão', attribute: 'Intelecto' },
      { name: 'Reflexos', attribute: 'Agilidade' },
      { name: 'Religião', attribute: 'Intelecto' },
      { name: 'Sobrevivência', attribute: 'Intelecto' },
      { name: 'Tática', attribute: 'Intelecto' },
      { name: 'Tecnologia', attribute: 'Intelecto' },
      { name: 'Vontade', attribute: 'Presença' },
    ],
    combatFields: { hp: true, mana: false, energy: true, ca: true, movement: true },
    hasInventory: true, hasAbilities: true, hasNotes: true,
  },
];

export const MONSTER_SYSTEM_PRESETS: MonsterPreset[] = [
  {
    id: 'preset-m-dnd5e',
    name: 'D&D 5e',
    system: 'dnd5e',
    attributes: [
      { name: 'Força' }, { name: 'Destreza' }, { name: 'Constituição' },
      { name: 'Inteligência' }, { name: 'Sabedoria' }, { name: 'Carisma' },
    ],
    combatFields: { hp: true, ca: true, movement: true },
    sections: { skills: true, attacks: true, abilities: true, resistances: true, immunities: true, senses: true, languages: true, inventory: true, notes: true },
  },
  {
    id: 'preset-m-tormenta20',
    name: 'Tormenta 20',
    system: 'tormenta20',
    attributes: [
      { name: 'Força' }, { name: 'Destreza' }, { name: 'Constituição' },
      { name: 'Inteligência' }, { name: 'Sabedoria' }, { name: 'Carisma' },
    ],
    combatFields: { hp: true, ca: true, movement: true },
    sections: { skills: true, attacks: true, abilities: true, resistances: true, immunities: true, senses: true, languages: true, inventory: true, notes: true },
  },
  {
    id: 'preset-m-cthulhu',
    name: 'Call of Cthulhu',
    system: 'cthulhu',
    attributes: [
      { name: 'FOR' }, { name: 'CON' }, { name: 'TAM' },
      { name: 'DES' }, { name: 'POD' }, { name: 'INT' },
    ],
    combatFields: { hp: true, ca: false, movement: true },
    sections: { skills: true, attacks: true, abilities: true, resistances: false, immunities: false, senses: true, languages: true, inventory: true, notes: true },
  },
  {
    id: 'preset-m-op',
    name: 'Ordem Paranormal',
    system: 'ordemparanormal',
    attributes: [
      { name: 'Agilidade' }, { name: 'Força' }, { name: 'Intelecto' },
      { name: 'Presença' }, { name: 'Vigor' },
    ],
    combatFields: { hp: true, ca: true, movement: true },
    sections: { skills: true, attacks: true, abilities: true, resistances: true, immunities: true, senses: true, languages: false, inventory: true, notes: true },
  },
];
