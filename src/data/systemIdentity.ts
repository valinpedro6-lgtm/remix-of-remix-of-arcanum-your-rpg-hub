export interface SystemIdentity {
  system: string;
  short: string;
  tagline: string;
  accent: string;
  surface: string;
  mark: string;
}

export const SYSTEM_IDENTITIES: SystemIdentity[] = [
  { system: 'dnd5e', short: 'D&D 5e', tagline: 'Fantasia heroica', accent: '#d9a441', surface: 'rgba(217,164,65,.12)', mark: 'D20' },
  { system: 'tormenta20', short: 'Tormenta 20', tagline: 'Aventura e deuses', accent: '#d45a3a', surface: 'rgba(212,90,58,.14)', mark: 'T20' },
  { system: 'pf2e', short: 'Pathfinder 2e', tagline: 'Precisão e descoberta', accent: '#6fa8dc', surface: 'rgba(111,168,220,.13)', mark: 'PF2' },
  { system: 'ordemparanormal', short: 'Ordem Paranormal', tagline: 'A Membrana está fraca', accent: '#b943d6', surface: 'rgba(185,67,214,.14)', mark: 'OP' },
  { system: 'cthulhu', short: 'Call of Cthulhu', tagline: 'A verdade enlouquece', accent: '#8aa38b', surface: 'rgba(138,163,139,.13)', mark: '7E' },
  { system: 'vtm5', short: 'Vampiro: A Máscara', tagline: 'A noite pertence a nós', accent: '#c74b57', surface: 'rgba(199,75,87,.14)', mark: 'V5' },
  { system: 'shadowrun5', short: 'Shadowrun 5e', tagline: 'Rua, magia e megacorps', accent: '#4fd1c5', surface: 'rgba(79,209,197,.13)', mark: 'SR' },
  { system: 'cpred', short: 'Cyberpunk RED', tagline: 'Estilo sobre substância', accent: '#ef5da8', surface: 'rgba(239,93,168,.14)', mark: 'RED' },
  { system: 'savageworlds', short: 'Savage Worlds', tagline: 'Fast, furious, fun', accent: '#f08c46', surface: 'rgba(240,140,70,.14)', mark: 'SWA' },
  { system: 'gurps', short: 'GURPS', tagline: 'Genericamente universal', accent: '#b8b8b8', surface: 'rgba(184,184,184,.11)', mark: 'G' },
  { system: 'fate', short: 'Fate Core', tagline: 'A história é o sistema', accent: '#83b5ff', surface: 'rgba(131,181,255,.13)', mark: 'F' },
  { system: 'morkborg', short: 'Mörk Borg', tagline: 'Morte, caos e miséria', accent: '#e5d94c', surface: 'rgba(229,217,76,.13)', mark: 'MB' },
  { system: 'blades', short: 'Blades in the Dark', tagline: 'Assombrações e golpes', accent: '#a58be7', surface: 'rgba(165,139,231,.14)', mark: 'BITD' },
  { system: 'dungeonworld', short: 'Dungeon World', tagline: 'Jogue para descobrir', accent: '#79c267', surface: 'rgba(121,194,103,.13)', mark: 'DW' },
  { system: '3det', short: '3D&T Alpha', tagline: 'Heróis em alta voltagem', accent: '#f0c14b', surface: 'rgba(240,193,75,.14)', mark: '3D' },
];

export const getSystemIdentity = (system: string) =>
  SYSTEM_IDENTITIES.find(identity => identity.system === system) ?? SYSTEM_IDENTITIES[0];
