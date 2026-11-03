export interface LiveSystemProfile {
  id: string;
  name: string;
  short: string;
  tagline: string;
  accent: string;
  dice: string;
  mainResource: string;
  secondaryResource: string;
  defense: string;
  health: string;
  lens: string;
  sceneTools: string[];
  generatorIds: { player: string; monster: string; loot: string };
}

export const LIVE_SYSTEMS: LiveSystemProfile[] = [
  { id: 'dnd5e', name: 'D&D 5e', short: 'D&D', tagline: 'Fantasia heroica', accent: '#d9a441', dice: 'd20', mainResource: 'Inspiração', secondaryResource: 'Concentração', defense: 'CA', health: 'PV', lens: 'Ações, condições e recursos por descanso.', sceneTools: ['Iniciativa', 'Condições', 'Concentração', 'Descanso'], generatorIds: { player: 'preset-dnd5e', monster: 'preset-m-dnd5e', loot: 'dnd5e' } },
  { id: 'tormenta20', name: 'Tormenta 20', short: 'T20', tagline: 'Aventura e deuses', accent: '#d45a3a', dice: 'd20', mainResource: 'Pontos de Mana', secondaryResource: 'Pontos de Ação', defense: 'Defesa', health: 'PV', lens: 'Poderes, condições e devoção em Arton.', sceneTools: ['Iniciativa', 'Condições', 'Poderes', 'Devoções'], generatorIds: { player: 'preset-tormenta20', monster: 'preset-m-tormenta20', loot: 'tormenta20' } },
  { id: 'pf2e', name: 'Pathfinder 2e', short: 'PF2', tagline: 'Precisão e descoberta', accent: '#6fa8dc', dice: 'd20', mainResource: 'Pontos de Heroísmo', secondaryResource: 'Ações', defense: 'CA', health: 'PV', lens: 'Três ações, graus de sucesso e condições.', sceneTools: ['Três Ações', 'Condições', 'Graus de Sucesso', 'Reações'], generatorIds: { player: 'preset-pf2e', monster: 'preset-m-pf2e', loot: 'pf2e' } },
  { id: 'ordemparanormal', name: 'Ordem Paranormal', short: 'OP', tagline: 'A Membrana está fraca', accent: '#b943d6', dice: 'd20', mainResource: 'NEX', secondaryResource: 'Sanidade', defense: 'Defesa', health: 'PV', lens: 'Exposição, elementos, pistas e rituais.', sceneTools: ['Sanidade', 'Pistas', 'Exposição', 'Rituais'], generatorIds: { player: 'preset-op', monster: 'preset-m-op', loot: 'ordemparanormal' } },
  { id: 'cthulhu', name: 'Call of Cthulhu 7e', short: 'CoC', tagline: 'A verdade enlouquece', accent: '#8aa38b', dice: 'd100', mainResource: 'Sanidade', secondaryResource: 'Pontos de Sorte', defense: 'Esquiva', health: 'PV', lens: 'Pistas, perícias, sorte e insanidade.', sceneTools: ['Sanidade', 'Pistas', 'Perícias', 'Insanidade'], generatorIds: { player: 'preset-cthulhu', monster: 'preset-m-cthulhu', loot: 'cthulhu' } },
  { id: 'vtm5', name: 'Vampiro: A Máscara 5e', short: 'V5', tagline: 'A noite pertence a nós', accent: '#c74b57', dice: 'pool d10', mainResource: 'Fome', secondaryResource: 'Humanidade', defense: 'Defesa', health: 'Vitalidade', lens: 'Fome, compulsões, disciplinas e a Fera.', sceneTools: ['Fome', 'Humanidade', 'Disciplinas', 'Compulsões'], generatorIds: { player: 'preset-vtm5', monster: 'preset-m-vtm5', loot: 'vtm5' } },
  { id: 'shadowrun5', name: 'Shadowrun 5e', short: 'SR5', tagline: 'Rua, magia e megacorps', accent: '#4fd1c5', dice: 'pool d6', mainResource: 'Edge', secondaryResource: 'Essência', defense: 'Armadura', health: 'Condição', lens: 'Pools, Edge, matriz e astral.', sceneTools: ['Pools', 'Edge', 'Matriz', 'Astral'], generatorIds: { player: 'preset-shadowrun', monster: 'preset-m-shadowrun', loot: 'generic' } },
  { id: 'cpred', name: 'Cyberpunk RED', short: 'RED', tagline: 'Estilo sobre substância', accent: '#ef5da8', dice: 'd10', mainResource: 'Humanidade', secondaryResource: 'Eurodólares', defense: 'Evasão', health: 'PV', lens: 'Cyberware, humanidade, cobertura e estilo.', sceneTools: ['Cyberware', 'Humanidade', 'Cobertura', 'Perseguições'], generatorIds: { player: 'preset-cpred', monster: 'preset-m-cpred', loot: 'generic' } },
  { id: 'savageworlds', name: 'Savage Worlds', short: 'SWADE', tagline: 'Fast, furious, fun', accent: '#f08c46', dice: 'dados + dado selvagem', mainResource: 'Bennies', secondaryResource: 'Aventuras', defense: 'Aparar', health: 'Resistência', lens: 'Ações rápidas, Ameaças e Bennies.', sceneTools: ['Bennies', 'Ameaças', 'Ações', 'Perseguições'], generatorIds: { player: 'preset-savage', monster: 'preset-m-savage', loot: 'generic' } },
  { id: 'gurps', name: 'GURPS', short: 'GURPS', tagline: 'Genericamente universal', accent: '#b8b8b8', dice: '3d6', mainResource: 'Pontos de Personagem', secondaryResource: 'Fadiga', defense: 'Esquiva', health: 'PV', lens: 'Testes de atributo, vantagens e fadiga.', sceneTools: ['Testes 3d6', 'Vantagens', 'Fadiga', 'Dano'], generatorIds: { player: 'preset-gurps', monster: 'preset-m-gurps', loot: 'generic' } },
  { id: 'fate', name: 'Fate Core', short: 'FATE', tagline: 'A história é o sistema', accent: '#83b5ff', dice: '4dF', mainResource: 'Pontos Fate', secondaryResource: 'Estresse', defense: 'Defesa', health: 'Estresse', lens: 'Aspectos, invocações, Fate Points e consequências.', sceneTools: ['Aspectos', 'Invocações', 'Estresse', 'Consequências'], generatorIds: { player: 'preset-fate', monster: 'preset-m-fate', loot: 'generic' } },
  { id: 'morkborg', name: 'Mörk Borg', short: 'MÖRK', tagline: 'Morte, caos e miséria', accent: '#e5d94c', dice: 'd20', mainResource: 'Omens', secondaryResource: 'Miséria', defense: 'Armadura', health: 'PV', lens: 'Presságios, miséria e sobrevivência.', sceneTools: ['Presságios', 'Miséria', 'Dano', 'Morte'], generatorIds: { player: 'preset-morkborg', monster: 'preset-m-morkborg', loot: 'generic' } },
  { id: 'blades', name: 'Blades in the Dark', short: 'BITD', tagline: 'Assombrações e golpes', accent: '#a58be7', dice: 'pool d6', mainResource: 'Stress', secondaryResource: 'Heat', defense: 'Resistência', health: 'Trauma', lens: 'Posição, efeito, stress e clock da cidade.', sceneTools: ['Clocks', 'Stress', 'Heat', 'Resistência'], generatorIds: { player: 'preset-blades', monster: 'preset-m-blades', loot: 'generic' } },
  { id: 'dungeonworld', name: 'Dungeon World', short: 'DW', tagline: 'Jogue para descobrir', accent: '#79c267', dice: '2d6', mainResource: 'XP', secondaryResource: 'Vínculos', defense: 'Armadura', health: 'PV', lens: 'Movimentos, vínculos e ficção primeiro.', sceneTools: ['Movimentos', 'Vínculos', 'XP', 'Perigo'], generatorIds: { player: 'preset-dw', monster: 'preset-m-dw', loot: 'generic' } },
  { id: '3det', name: '3D&T Alpha', short: '3D&T', tagline: 'Heróis em alta voltagem', accent: '#f0c14b', dice: 'd6', mainResource: 'Pontos de Magia', secondaryResource: 'Pontos de Destino', defense: 'Armadura', health: 'Pontos de Vida', lens: 'Escalas, vantagens e ataques especiais.', sceneTools: ['Ataques Especiais', 'Escalas', 'Vantagens', 'Arena'], generatorIds: { player: 'preset-3det', monster: 'preset-m-3det', loot: 'generic' } },
];

export const getLiveSystem = (id: string) => LIVE_SYSTEMS.find(system => system.id === id) ?? LIVE_SYSTEMS[0];
export const getActiveSystemId = () => localStorage.getItem('arcanum-active-system') || 'dnd5e';
export const setActiveSystemId = (id: string) => {
  localStorage.setItem('arcanum-active-system', id);
  window.dispatchEvent(new CustomEvent('arcanum-system-change', { detail: id }));
};
