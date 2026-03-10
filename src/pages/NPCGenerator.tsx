import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserPlus, Save, Trash2, Sparkles, Shield, Heart, Target,
  Skull, Eye, EyeOff, ChevronDown, ChevronUp, Swords,
  Flame, Brain, Zap, Crown, BookOpen, Scroll
} from 'lucide-react';
import { PLAYER_SYSTEM_PRESETS, type PlayerPreset } from '@/data/rpgSystemPresets';

// --- TYPES ---

type RegionType =
  | 'floresta' | 'montanha' | 'costa' | 'deserto' | 'cidade' | 'pantano' | 'subterraneo'
  | 'tundra' | 'savana' | 'vulcanico' | 'arquipelago' | 'ruinas' | 'acampamento' | 'navio'
  | 'cemiterio' | 'planicie' | 'personalizado';

interface GeneratedAttribute {
  name: string;
  value: number;
  modifier: number;
}

interface GeneratedSkill {
  name: string;
  attribute: string;
  bonus: number;
}

interface NPC {
  id: string;
  name: string;
  race: string;
  npcClass: string;
  personality: string;
  quirk: string;
  occupation: string;
  secret: string;
  objective: string;
  backstory: string;
  hp: number;
  ac: number;
  region: RegionType;
  isVillain: false;
  fear: string;
  desire: string;
  hatred: string;
  ambition: string;
  memory: string;
  systemId: string;
  systemName: string;
  attributes: GeneratedAttribute[];
  skills: GeneratedSkill[];
}

interface Villain {
  id: string;
  name: string;
  race: string;
  npcClass: string;
  personality: string;
  quirk: string;
  occupation: string;
  secret: string;
  objective: string;
  backstory: string;
  hp: number;
  ac: number;
  region: RegionType;
  isVillain: true;
  motivation: string;
  planPhase1: string;
  planPhase2: string;
  planFinal: string;
  hiddenWeaknesses: string[];
  fear: string;
  desire: string;
  hatred: string;
  ambition: string;
  memory: string;
  systemId: string;
  systemName: string;
  attributes: GeneratedAttribute[];
  skills: GeneratedSkill[];
}

type Character = NPC | Villain;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rollDice = (count: number, sides: number, bonus = 0) => {
  let total = bonus;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
};

// --- REGIONAL DATA ---

const REGION_LABELS: Record<RegionType, string> = {
  floresta: 'Floresta', montanha: 'Montanha', costa: 'Costa', deserto: 'Deserto',
  cidade: 'Cidade', pantano: 'Pântano', subterraneo: 'Subterrâneo',
  tundra: 'Tundra', savana: 'Savana', vulcanico: 'Vulcânico',
  arquipelago: 'Arquipélago', ruinas: 'Ruínas', acampamento: 'Acampamento',
  navio: 'Navio', cemiterio: 'Cemitério', planicie: 'Planície',
  personalizado: 'Personalizado',
};

const NAMES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Thalion', 'Elowen', 'Faenor', 'Miriel', 'Silvanus', 'Brenna', 'Arden', 'Lirael', 'Oakhart', 'Ivy'],
  montanha: ['Thorin', 'Brunhild', 'Grimjaw', 'Helga', 'Stoneforge', 'Ulfgar', 'Magna', 'Krag', 'Ingrid', 'Balric'],
  costa: ['Coralia', 'Nereus', 'Marina', 'Tritão', 'Ondina', 'Pescador', 'Gaivota', 'Maré', 'Âncora', 'Sirena'],
  deserto: ['Zahir', 'Amira', 'Khalid', 'Safira', 'Rashid', 'Nadir', 'Layla', 'Tarik', 'Jamila', 'Darius'],
  cidade: ['Alaric', 'Beatriz', 'Cedric', 'Dahlia', 'Edmund', 'Fiona', 'Gareth', 'Helena', 'Leopold', 'Viviane'],
  pantano: ['Boggart', 'Murk', 'Fenn', 'Sombria', 'Musgo', 'Raíz', 'Lodo', 'Cobra', 'Vaporia', 'Turfa'],
  subterraneo: ['Shade', 'Nyx', 'Obsidian', 'Ônix', 'Umbra', 'Cinza', 'Eco', 'Vírion', 'Nethys', 'Profunda'],
  tundra: ['Bjorn', 'Freya', 'Sigurd', 'Astrid', 'Fenrir', 'Hilda', 'Ragnar', 'Solveig', 'Eirik', 'Ylva'],
  savana: ['Zuri', 'Amani', 'Kofi', 'Nia', 'Jabari', 'Makena', 'Tau', 'Imara', 'Sekou', 'Adaeze'],
  vulcanico: ['Ignis', 'Cindera', 'Vulkar', 'Pyra', 'Obsidius', 'Magmus', 'Scoria', 'Ember', 'Caldera', 'Fumara'],
  arquipelago: ['Moana', 'Kai', 'Luana', 'Tane', 'Coral', 'Remo', 'Isla', 'Maui', 'Onda', 'Navegante'],
  ruinas: ['Relicário', 'Vestígio', 'Eco', 'Cinza', 'Arcanis', 'Fragmento', 'Sombra', 'Pedra', 'Ruína', 'Tempo'],
  acampamento: ['Fogo', 'Estrada', 'Viajante', 'Lobo', 'Estrela', 'Trilha', 'Noite', 'Fogueira', 'Vento', 'Rastreador'],
  navio: ['Capitão Maré', 'Âncora', 'Vela', 'Marinheiro', 'Bússola', 'Tempestade', 'Gaivota', 'Leme', 'Porto', 'Sirena'],
  cemiterio: ['Coveiro', 'Sombra', 'Lápide', 'Silêncio', 'Fantasma', 'Cripta', 'Véu', 'Cinzas', 'Memória', 'Vigília'],
  planicie: ['Horizonte', 'Vento', 'Trigo', 'Cavaleiro', 'Pradaria', 'Falcão', 'Colina', 'Semente', 'Aragem', 'Pastora'],
  personalizado: ['Alaric', 'Bruna', 'Cedric', 'Dahlia', 'Eldric', 'Fiona', 'Gareth', 'Helena', 'Igor', 'Jasmine'],
};

const RACES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Elfo da Floresta', 'Meio-Elfo', 'Firbolg', 'Gnomo das Florestas', 'Humano', 'Sátiro'],
  montanha: ['Anão da Montanha', 'Goliath', 'Humano', 'Anão da Colina', 'Meio-Orc', 'Gnomo das Rochas'],
  costa: ['Humano', 'Meio-Elfo', 'Tritão', 'Genasi da Água', 'Halfling', 'Elfo do Mar'],
  deserto: ['Humano', 'Draconato', 'Genasi do Fogo', 'Tiefling', 'Meio-Orc', 'Aarakocra'],
  cidade: ['Humano', 'Meio-Elfo', 'Halfling', 'Tiefling', 'Gnomo', 'Anão', 'Draconato'],
  pantano: ['Humano', 'Meio-Orc', 'Grung', 'Lagarto', 'Goblin', 'Halfling'],
  subterraneo: ['Drow', 'Duergar', 'Gnomo das Profundezas', 'Tiefling', 'Goblin', 'Kobold'],
  tundra: ['Goliath', 'Humano', 'Anão da Colina', 'Meio-Orc', 'Firbolg', 'Genasi do Gelo'],
  savana: ['Humano', 'Leonino', 'Tabaxi', 'Centauro', 'Meio-Orc', 'Aarakocra'],
  vulcanico: ['Genasi do Fogo', 'Draconato Vermelho', 'Tiefling', 'Anão do Fogo', 'Humano', 'Azer'],
  arquipelago: ['Humano', 'Tritão', 'Elfo do Mar', 'Genasi da Água', 'Halfling', 'Tortuga'],
  ruinas: ['Humano', 'Tiefling', 'Elfo Alto', 'Gnomo', 'Warforged', 'Meio-Elfo'],
  acampamento: ['Humano', 'Halfling', 'Meio-Elfo', 'Anão', 'Gnomo', 'Meio-Orc'],
  navio: ['Humano', 'Meio-Elfo', 'Halfling', 'Tritão', 'Genasi da Água', 'Tabaxi'],
  cemiterio: ['Humano', 'Tiefling', 'Dhampir', 'Reborn', 'Elfo Sombrio', 'Meio-Orc'],
  planicie: ['Humano', 'Halfling', 'Centauro', 'Meio-Elfo', 'Gnomo', 'Firbolg'],
  personalizado: ['Humano', 'Elfo', 'Anão', 'Halfling', 'Meio-Orc', 'Tiefling', 'Gnomo', 'Draconato'],
};

const CLASSES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Ranger', 'Druida', 'Ladino', 'Bardo', 'Guerreiro', 'Plebeu'],
  montanha: ['Guerreiro', 'Bárbaro', 'Clérigo', 'Paladino', 'Monge', 'Plebeu'],
  costa: ['Bardo', 'Feiticeiro', 'Ranger', 'Guerreiro', 'Ladino', 'Plebeu'],
  deserto: ['Monge', 'Feiticeiro', 'Guerreiro', 'Bruxo', 'Ranger', 'Plebeu'],
  cidade: ['Ladino', 'Bardo', 'Mago', 'Guerreiro', 'Clérigo', 'Paladino', 'Plebeu'],
  pantano: ['Druida', 'Bruxo', 'Ranger', 'Bárbaro', 'Ladino', 'Plebeu'],
  subterraneo: ['Bruxo', 'Ladino', 'Mago', 'Guerreiro', 'Clérigo', 'Necromante'],
  tundra: ['Bárbaro', 'Ranger', 'Druida', 'Clérigo', 'Guerreiro', 'Plebeu'],
  savana: ['Ranger', 'Bárbaro', 'Druida', 'Guerreiro', 'Bardo', 'Plebeu'],
  vulcanico: ['Feiticeiro', 'Guerreiro', 'Clérigo', 'Bruxo', 'Bárbaro', 'Forjador'],
  arquipelago: ['Ranger', 'Bardo', 'Feiticeiro', 'Ladino', 'Guerreiro', 'Plebeu'],
  ruinas: ['Mago', 'Ladino', 'Guerreiro', 'Bruxo', 'Clérigo', 'Explorador'],
  acampamento: ['Guerreiro', 'Ranger', 'Bardo', 'Clérigo', 'Ladino', 'Plebeu'],
  navio: ['Guerreiro', 'Ladino', 'Bardo', 'Ranger', 'Feiticeiro', 'Plebeu'],
  cemiterio: ['Clérigo', 'Bruxo', 'Necromante', 'Paladino', 'Ladino', 'Plebeu'],
  planicie: ['Guerreiro', 'Ranger', 'Bardo', 'Druida', 'Paladino', 'Plebeu'],
  personalizado: ['Guerreiro', 'Mago', 'Ladino', 'Clérigo', 'Bardo', 'Ranger', 'Plebeu'],
};

const OCCUPATIONS_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Lenhador', 'Herbalista', 'Caçador', 'Guia florestal', 'Apicultor', 'Eremita', 'Druida da vila'],
  montanha: ['Minerador', 'Ferreiro', 'Pastor de cabras', 'Guia de montanha', 'Monge recluso', 'Pedreiro'],
  costa: ['Pescador', 'Navegador', 'Construtor de barcos', 'Mercador marítimo', 'Faroleiro', 'Mergulhador'],
  deserto: ['Mercador de caravanas', 'Adivinho', 'Domador de animais', 'Buscador de água', 'Nômade', 'Arqueólogo'],
  cidade: ['Taberneiro', 'Mercador', 'Guarda', 'Escriba', 'Artesão', 'Alquimista', 'Político', 'Ladrão aposentado'],
  pantano: ['Caçador de criaturas', 'Curandeiro', 'Coletador de ervas', 'Pescador', 'Guia do pântano', 'Exilado'],
  subterraneo: ['Minerador profundo', 'Fungicultor', 'Contrabandista', 'Explorador', 'Feiticeiro exilado', 'Guarda de túnel'],
  tundra: ['Caçador de peles', 'Xamã', 'Pastor de renas', 'Pescador de gelo', 'Rastreador', 'Curandeiro tribal'],
  savana: ['Caçador de feras', 'Pastor de gado', 'Rastreador', 'Curandeiro tribal', 'Comerciante nômade', 'Domador'],
  vulcanico: ['Forjador de lava', 'Alquimista do fogo', 'Minerador de obsidiana', 'Sacerdote do vulcão', 'Guia vulcânico', 'Coletor de enxofre'],
  arquipelago: ['Pescador de alto mar', 'Navegador', 'Comerciante insular', 'Mergulhador de pérolas', 'Construtor de canoas', 'Faroleiro'],
  ruinas: ['Arqueólogo', 'Caçador de tesouros', 'Cartógrafo', 'Historiador', 'Saqueador', 'Guardião de ruínas'],
  acampamento: ['Cozinheiro', 'Mercador itinerante', 'Guarda noturno', 'Curandeiro de campo', 'Ferreiro ambulante', 'Bardo viajante'],
  navio: ['Capitão', 'Imediato', 'Navegador', 'Artilheiro', 'Cozinheiro de bordo', 'Carpinteiro naval'],
  cemiterio: ['Coveiro', 'Zelador sagrado', 'Necromante oculto', 'Clérigo dos mortos', 'Vigília noturna', 'Exorcista'],
  planicie: ['Fazendeiro', 'Pastor', 'Cavaleiro errante', 'Mercador de grãos', 'Caçador de recompensas', 'Herbalista'],
  personalizado: ['Ferreiro', 'Taberneiro', 'Mercador', 'Curandeiro', 'Guarda', 'Caçador de recompensas'],
};

const PERSONALITIES = [
  'Corajoso e destemido', 'Tímido e reservado', 'Arrogante e vaidoso', 'Gentil e prestativo',
  'Misterioso e enigmático', 'Brincalhão e sarcástico', 'Sério e focado', 'Paranoico e desconfiado',
  'Otimista e alegre', 'Melancólico e filosófico', 'Impaciente e explosivo', 'Calmo e sábio',
  'Manipulador e calculista', 'Leal até a morte', 'Covarde mas esperto', 'Honrado e inflexível',
];

const QUIRKS = [
  'Fala sozinho constantemente', 'Coleciona ossos de criaturas', 'Tem medo irracional de gatos',
  'Ri em momentos inapropriados', 'Sempre come algo', 'Faz rimas sem querer',
  'Coça o nariz quando mente', 'Tem um tique no olho', 'Fala em terceira pessoa',
  'Carrega um objeto de estimação estranho', 'Assobia melodias desconhecidas', 'Nunca faz contato visual',
  'Conta moedas obsessivamente', 'Desenha no chão enquanto fala', 'Cheira tudo antes de comer',
];

// --- EMOTION DATA ---

const FEARS = [
  'Tem pavor de escuridão completa', 'Morre de medo de aranhas gigantes', 'Teme ser esquecido por todos',
  'Tem terror de morrer sozinho', 'Pânico de alturas extremas', 'Medo irracional de magia descontrolada',
  'Teme traição de quem ama', 'Pavor de ser enterrado vivo', 'Medo de perder a sanidade',
  'Teme o som de trovões', 'Horror de criaturas mortas-vivas', 'Medo de fogo descontrolado',
  'Teme que seu passado o alcance', 'Pânico em espaços fechados', 'Medo de água profunda',
  'Teme profecias sobre sua morte', 'Pavor de dragões', 'Medo de ser controlado mentalmente',
];

const DESIRES = [
  'Deseja encontrar seu verdadeiro lar', 'Quer ser lembrado como um herói', 'Busca o amor verdadeiro acima de tudo',
  'Deseja riqueza suficiente para nunca mais passar fome', 'Quer encontrar a cura para uma doença de alguém querido',
  'Busca conhecimento proibido', 'Deseja vingança contra quem destruiu sua vida', 'Quer provar seu valor ao mundo',
  'Busca redenção por erros do passado', 'Deseja paz e uma vida simples', 'Quer se tornar o mais forte de todos',
  'Busca imortalidade', 'Deseja libertar seu povo da opressão', 'Quer construir algo que dure para sempre',
  'Busca reunir sua família perdida', 'Deseja descobrir a verdade sobre sua origem',
];

const HATREDS = [
  'Odeia mentirosos acima de tudo', 'Detesta a nobreza e seus privilégios', 'Tem ódio profundo de mortos-vivos',
  'Odeia quem maltrata os fracos', 'Detesta magia por uma experiência traumática', 'Odeia traidores com paixão',
  'Tem rancor contra uma raça específica por algo do passado', 'Odeia covardes que fogem de luta',
  'Detesta autoridade e ordens', 'Odeia a ideia de destino pré-definido', 'Tem raiva de deuses que ignoram súplicas',
  'Detesta mercadores gananciosos', 'Odeia quem usa crianças como peões', 'Tem ódio de escravidão em qualquer forma',
  'Detesta quem destrói a natureza', 'Odeia cultistas e fanáticos religiosos',
];

const AMBITIONS = [
  'Quer fundar seu próprio reino', 'Almeja se tornar o maior mago da era', 'Planeja abrir a maior taverna do continente',
  'Quer formar uma guilda de aventureiros lendária', 'Almeja derrotar um dragão ancestral sozinho',
  'Planeja mapear todo o mundo conhecido', 'Quer criar uma arma lendária', 'Almeja se tornar conselheiro de um rei',
  'Planeja construir uma escola de magia', 'Quer unir todas as raças em paz', 'Almeja encontrar o artefato mais poderoso',
  'Planeja destruir uma organização maligna por dentro', 'Quer escrever o maior livro de história já feito',
  'Almeja dominar todas as formas de combate', 'Planeja criar uma nova ordem de cavaleiros',
  'Quer descobrir o que existe além do mapa', 'Almeja se tornar imortal através de seus feitos',
];

const MEMORIES = [
  'Lembra-se vividamente do dia em que perdeu tudo em um incêndio', 'Guarda a memória de um mentor que morreu nos seus braços',
  'Nunca esquece o cheiro da comida que sua mãe fazia', 'Tem uma memória recorrente de uma floresta que nunca visitou',
  'Lembra-se de uma promessa feita a um amigo de infância que nunca cumpriu', 'Guarda a memória de ter visto um deus em sonho',
  'Nunca esquece o rosto da primeira pessoa que matou', 'Tem uma lembrança feliz de dançar sob a chuva na juventude',
  'Lembra-se de ter sido salvo por um estranho que nunca mais viu', 'Guarda a memória de uma canção que sua avó cantava',
  'Nunca esquece a traição de seu melhor amigo', 'Tem uma memória vaga de uma vida passada como outra pessoa',
  'Lembra-se de uma noite estrelada em que sentiu verdadeira paz', 'Guarda a memória de ter encontrado algo mágico na infância',
  'Nunca esquece as últimas palavras de alguém que amava', 'Tem uma lembrança perturbadora de vozes sussurrando seu nome',
];

const SECRETS_BY_REGION: Record<RegionType, string[]> = {
  floresta: [
    'Sabe onde está uma árvore ancestral de poder imenso', 'É protegido por um espírito da floresta',
    'Caçou uma criatura sagrada por engano', 'Encontrou ruínas élficas com inscrições proibidas',
    'Fez um pacto com uma fada sombria', 'Esconde um fugitivo nas profundezas da mata',
  ],
  montanha: [
    'Conhece uma passagem secreta através da montanha', 'Encontrou veio de mithril e esconde de todos',
    'Sobreviveu a uma avalanche que matou sua família', 'É descendente de gigantes',
    'Guarda a entrada de uma tumba anã ancestral', 'Ouviu a voz de um dragão adormecido',
  ],
  costa: [
    'Encontrou restos de um navio com tesouro amaldiçoado', 'É secretamente um pirata aposentado',
    'Fez um trato com uma criatura marinha', 'Sabe a localização de uma cidade submersa',
    'Perdeu alguém no mar e ouve vozes à noite', 'Contrabandeia mercadorias raras',
  ],
  deserto: [
    'Possui um mapa de um oásis encantado', 'É o último de uma tribo nômade extinta',
    'Encontrou uma lâmpada com algo selado dentro', 'Serviu a um tirano do deserto',
    'Sabe onde está enterrada uma relíquia antiga', 'Fez um pacto com um djinn',
  ],
  cidade: [
    'É um espião de outro reino', 'Possui uma dívida impagável com a guilda de ladrões',
    'Testemunhou um assassinato político', 'É herdeiro de um trono perdido',
    'Faz parte de uma sociedade secreta', 'Chantageia um nobre poderoso',
  ],
  pantano: [
    'Sabe invocar espíritos do pântano', 'Esconde um portal para o Feywild no pântano',
    'É amaldiçoado e lentamente se transforma em criatura do pântano',
    'Encontrou um grimório afundado na lama', 'É perseguido por uma bruxa do pântano',
    'Guarda um segredo sobre uma praga que veio do pântano',
  ],
  subterraneo: [
    'Conhece túneis que levam ao Underdark', 'É um drow exilado vivendo disfarçado',
    'Encontrou cristais que amplificam magia', 'É vigiado por um Observador',
    'Traiu uma colônia subterrânea', 'Possui um mapa do Underdark incompleto',
  ],
  tundra: [
    'Sabe a localização de uma fortaleza de gigantes do gelo', 'Sobreviveu a um ataque de dragão branco',
    'Encontrou uma relíquia congelada no gelo', 'Comunicou-se com espíritos do inverno',
    'Esconde provisões roubadas de uma caravana', 'Fez um pacto com uma entidade do frio eterno',
  ],
  savana: [
    'Sabe onde está o cemitério de elefantes lendário', 'É o último guardião de um totem tribal',
    'Foi amaldiçoado por um xamã rival', 'Encontrou pegadas de uma criatura extinta',
    'Esconde um mapa de minas de diamantes', 'Comunicou-se com os espíritos da savana',
  ],
  vulcanico: [
    'Sabe como acalmar o vulcão com um ritual', 'Encontrou um ovo de fênix na lava',
    'É imune ao calor por causa de um experimento arcano', 'Encontrou uma passagem para o Plano do Fogo',
    'Sabe de uma arma forjada na lava do vulcão', 'Serviu um efreeti por 10 anos',
  ],
  arquipelago: [
    'Sabe a rota para uma ilha que aparece apenas na lua cheia', 'Encontrou uma pérola que concede desejos',
    'É descendente de uma civilização submersa', 'Contrabandeia artefatos entre ilhas',
    'Sabe onde está o naufrágio de um navio lendário', 'Fez um pacto com um espírito do mar',
  ],
  ruinas: [
    'Sabe a palavra de ativação de um golem guardião', 'Encontrou um mapa de uma rede de ruínas conectadas',
    'Leu inscrições que profetizam uma catástrofe', 'Roubou um artefato e é perseguido por seus guardiões',
    'Sabe como abrir uma câmara secreta selada há milênios', 'Foi amaldiçoado ao tocar uma relíquia',
  ],
  acampamento: [
    'Esconde um fugitivo na tenda', 'Carrega uma mensagem secreta para outro reino',
    'É um desertor de um exército', 'Roubou suprimentos do acampamento vizinho',
    'Sabe que um dos viajantes é um espião', 'Encontrou um mapa do tesouro na estrada',
  ],
  navio: [
    'O navio carrega contrabando no porão', 'O capitão não é quem diz ser',
    'Há um motim sendo planejado', 'Encontrou coordenadas de uma ilha do tesouro',
    'Sabe que o navio está amaldiçoado', 'É um pirata disfarçado de marinheiro',
  ],
  cemiterio: [
    'Sabe como invocar um espírito específico', 'Encontrou uma entrada para catacumbas esquecidas',
    'É assombrado por um fantasma que só ele vê', 'Roubou relíquias de túmulos sagrados',
    'Sabe de um necromante que atua nas sombras', 'Fez um pacto com um espírito para evitar a morte',
  ],
  planicie: [
    'Sabe de um tesouro enterrado sob um carvalho solitário', 'É perseguido por bandidos de estrada',
    'Viu uma criatura voadora descomunal passando nas planícies', 'Esconde uma identidade nobre',
    'Encontrou ruínas enterradas sob um campo de trigo', 'Fez um pacto com espíritos dos ventos',
  ],
  personalizado: [
    'É um espião de outro reino', 'Possui uma dívida impagável', 'Fez um pacto com um demônio',
    'Está fugindo de uma guilda de assassinos', 'Guarda um artefato perigoso', 'Conhece uma masmorra antiga',
  ],
};

const OBJECTIVES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Proteger a floresta de invasores', 'Encontrar uma erva lendária para curar uma doença', 'Descobrir por que os animais estão fugindo', 'Vingar a destruição de sua aldeia', 'Estabelecer um santuário de criaturas mágicas', 'Recuperar um artefato druídico roubado'],
  montanha: ['Reclamar uma fortaleza anã perdida', 'Encontrar o túmulo de um herói lendário', 'Descobrir a fonte dos tremores recentes', 'Acumular riqueza para libertar seu clã', 'Escalar o pico mais alto em busca de iluminação', 'Forjar a arma definitiva'],
  costa: ['Encontrar um navio lendário naufragado', 'Proteger a vila de piratas', 'Descobrir o que está matando os peixes', 'Construir uma frota e explorar terras distantes', 'Recuperar algo perdido no fundo do mar', 'Estabelecer uma rota comercial lucrativa'],
  deserto: ['Encontrar o oásis perdido', 'Unir as tribos nômades contra uma ameaça', 'Recuperar uma relíquia de uma pirâmide', 'Escapar de uma maldição do deserto', 'Construir um assentamento permanente', 'Descobrir a verdade sobre ruínas enterradas'],
  cidade: ['Subir na hierarquia política', 'Desmascarar um conspirador na corte', 'Abrir o melhor estabelecimento da cidade', 'Encontrar um ente querido desaparecido', 'Limpar seu nome de uma acusação falsa', 'Infiltrar-se na guilda de ladrões'],
  pantano: ['Encontrar a cura para a maldição do pântano', 'Expulsar as criaturas que invadem sua terra', 'Localizar um artefato perdido na lama', 'Descobrir a origem de luzes estranhas no pântano', 'Proteger um vilarejo isolado', 'Negociar paz com as criaturas do pântano'],
  subterraneo: ['Encontrar a saída para a superfície', 'Reclamar território de outras facções', 'Descobrir o que está causando colapsos nos túneis', 'Roubar um tesouro guardado por aberrações', 'Estabelecer uma rota de comércio subterrânea', 'Selar uma fenda planar nas profundezas'],
  tundra: ['Encontrar a fortaleza perdida dos gigantes', 'Sobreviver ao inverno mais rigoroso de todos', 'Rastrear uma fera lendária do gelo', 'Unir os clãs nômades contra uma ameaça', 'Encontrar a fonte de calor mágico', 'Resgatar prisioneiros de um dragão branco'],
  savana: ['Proteger a manada sagrada', 'Encontrar a fonte de uma seca mágica', 'Unir as tribos contra invasores', 'Rastrear uma criatura lendária', 'Encontrar as minas de diamantes perdidas', 'Estabelecer paz com os leões telepáticos'],
  vulcanico: ['Impedir a erupção catastrófica', 'Encontrar a forja ancestral nas profundezas do vulcão', 'Resgatar prisioneiros dos elementais de fogo', 'Obter um fragmento de lava mágica', 'Fechar o portal para o Plano do Fogo', 'Forjar uma arma lendária na lava'],
  arquipelago: ['Mapear todas as ilhas do arquipélago', 'Encontrar a ilha lendária do tesouro', 'Estabelecer comércio entre as ilhas', 'Combater a pirataria nas rotas marítimas', 'Encontrar a cidade submersa', 'Proteger as ilhas de um monstro marinho'],
  ruinas: ['Descobrir o segredo da civilização perdida', 'Encontrar o artefato mais poderoso das ruínas', 'Mapear todas as câmaras secretas', 'Libertar um prisioneiro selado nas ruínas', 'Decifrar as inscrições antigas', 'Impedir que saqueadores destruam as relíquias'],
  acampamento: ['Proteger o acampamento de ataques', 'Encontrar suprimentos para o grupo', 'Descobrir o traidor entre os viajantes', 'Chegar ao destino final em segurança', 'Negociar com bandidos da estrada', 'Recrutar aliados para uma missão'],
  navio: ['Completar a rota comercial', 'Encontrar a ilha do tesouro', 'Sobreviver à travessia', 'Caçar um monstro marinho', 'Impedir o motim', 'Entregar a carga secreta'],
  cemiterio: ['Colocar um espírito para descansar', 'Encontrar o túmulo de um herói lendário', 'Impedir um ritual de necromancia', 'Descobrir quem profanou os túmulos', 'Encontrar uma relíquia sagrada enterrada', 'Purificar o cemitério da energia sombria'],
  planicie: ['Proteger a fazenda de bandidos', 'Encontrar as ruínas sob os campos', 'Rastrear uma criatura que ataca o gado', 'Estabelecer um posto avançado', 'Descobrir o segredo do carvalho solitário', 'Escoltar uma caravana pela planície'],
  personalizado: ['Buscar poder a qualquer custo', 'Encontrar um artefato lendário', 'Proteger alguém importante', 'Vingar-se de quem o traiu', 'Descobrir a verdade sobre seu passado', 'Construir algo grandioso'],
};

const BACKSTORIES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Cresceu entre os elfos da floresta após ser abandonado quando bebê. Aprendeu a língua dos animais e a ler os sinais da natureza.', 'Era um lenhador até o dia em que cortou uma árvore sagrada. Desde então, busca redenção servindo como protetor da mata.', 'Sobrevivente de um incêndio florestal que destruiu sua aldeia. Vive sozinho, desconfiado de forasteiros.', 'Foi aprendiz de um druida poderoso que desapareceu misteriosamente. Busca respostas nas profundezas da floresta.'],
  montanha: ['Nasceu em uma fortaleza anã nas profundezas da montanha. Deixou seu lar após um desentendimento com o conselho de anciãos.', 'Era um pastor de cabras até encontrar uma caverna com escrituras antigas. Desde então, estuda os segredos da montanha.', 'Sobrevivente de uma avalanche que soterrou toda sua vila. Carrega a culpa de ser o único sobrevivente.', 'Treinou como monge em um monastério no pico da montanha. Desceu para cumprir uma missão sagrada.'],
  costa: ['Filho de pescadores, cresceu ouvindo lendas do mar. Um dia, viu algo no fundo do oceano que mudou sua vida para sempre.', 'Era marinheiro em um navio mercante até um naufrágio. Foi salvo por criaturas marinhas e agora protege a costa.', 'Cresceu em um farol isolado com apenas livros como companhia. Conhece todas as histórias do mar, mas nunca navegou.', 'Ex-pirata que abandonou a vida de crimes após uma tempestade que quase o matou. Agora vive uma vida pacata, mas o passado o persegue.'],
  deserto: ['Nasceu em uma caravana nômade que cruzava o grande deserto. Conhece cada duna e oásis como a palma de sua mão.', 'Era guarda de um sultão até descobrir seus planos sombrios. Fugiu para o deserto e agora vive como exilado.', 'Encontrou uma relíquia antiga enterrada na areia que lhe concedeu visões do passado. Busca entender seu significado.', 'Cresceu em um oásis isolado, acreditando que o deserto era o mundo inteiro. Descobriu a verdade e agora explora.'],
  cidade: ['Cresceu nas ruas da cidade, aprendendo a sobreviver com astúcia. Agora quer ser alguém respeitável, mas o passado insiste em voltar.', 'Herdeiro de uma família nobre em decadência. Mantém aparências enquanto busca restaurar a fortuna familiar.', 'Era aprendiz de um mago da academia até um experimento dar errado. Foi expulso e agora trabalha como artesão.', 'Chegou à cidade fugindo de um passado sombrio. Construiu uma nova identidade, mas vive com medo de ser descoberto.'],
  pantano: ['Nasceu e cresceu no pântano, em uma comunidade isolada que adora espíritos antigos. Foi exilado por questionar as tradições.', 'Era um estudioso que veio pesquisar o pântano e nunca mais conseguiu sair. Algo o prende aqui, algo que ele não entende.', 'Sobrevivente de uma expedição que deu errado. Todos morreram, menos ele. Agora vive no pântano, meio louco, meio sábio.', 'Curandeiro que usa as plantas raras do pântano. É respeitado e temido em igual medida pelos poucos que vivem aqui.'],
  subterraneo: ['Nasceu na escuridão e nunca viu a luz do sol. Conhece os túneis como ninguém e tem uma aversão profunda à superfície.', 'Era um minerador até encontrar uma caverna com cristais que sussurram. Desde então, ouve vozes que guiam seus passos.', 'Fugiu da superfície após cometer um crime terrível. Encontrou refúgio no subterrâneo, mas a culpa nunca o abandonou.', 'Membro de uma expedição de exploração que ficou preso quando os túneis colapsaram. Adaptou-se e fez do subterrâneo seu lar.'],
  tundra: ['Nasceu em um clã nômade que segue as manadas de renas. Quando o clã foi dizimado por gigantes do gelo, ficou sozinho.', 'Era um explorador que ficou perdido na tundra por meses. Sobreviveu graças a espíritos do gelo que o guiaram.', 'Cresceu em uma fortaleza isolada no gelo, protegendo uma passagem antiga contra ameaças desconhecidas.', 'Xamã que ouve as vozes dos ancestrais nas tempestades de neve. Busca unir os clãs antes do grande inverno.'],
  savana: ['Cresceu como caçador em uma tribo que venera os grandes felinos. Foi escolhido para uma missão sagrada pelo totem tribal.', 'Era um pastor até que uma seca mágica destruiu tudo. Agora busca a fonte da maldição para salvar sua terra.', 'Filho de um líder tribal, foi exilado após perder um duelo de honra. Vaga pela savana buscando redenção.', 'Rastreador lendário que conhece cada trilha da savana. Diz-se que conversa com os animais, mas ninguém sabe a verdade.'],
  vulcanico: ['Nasceu perto de um vulcão ativo e sempre sentiu afinidade com o fogo. Descobriu que é descendente de um elemental.', 'Era um ferreiro que forjava armas na lava do vulcão. Um acidente o marcou, mas também lhe deu poderes.', 'Sobrevivente de uma erupção que destruiu sua comunidade. Agora estuda o vulcão para prever futuras catástrofes.', 'Sacerdote de um culto do fogo que questiona os ensinamentos após descobrir uma verdade sombria sobre o vulcão.'],
  arquipelago: ['Cresceu navegando entre as ilhas, conhece cada recife e corrente. Sonha em encontrar a ilha mítica do fim do mundo.', 'Era um mergulhador de pérolas até encontrar algo no fundo do mar que mudou sua vida. Agora busca respostas nas ilhas.', 'Naufragou em uma ilha deserta e sobreviveu por anos. Foi resgatado, mas nunca mais foi o mesmo.', 'Comerciante que viaja entre as ilhas levando mercadorias e histórias. Conhece todos os segredos do arquipélago.'],
  ruinas: ['Arqueólogo obcecado com a civilização que construiu as ruínas. Passou anos decifrando seus segredos.', 'Encontrou as ruínas por acidente e foi amaldiçoado por um guardião antigo. Agora busca quebrar a maldição.', 'Descendente dos construtores originais das ruínas. Sente uma conexão mística com o lugar.', 'Saqueador que ficou preso nas ruínas por uma armadilha mágica. Quando escapou, já não era a mesma pessoa.'],
  acampamento: ['Viajante eterno que nunca fica no mesmo lugar por mais de uma semana. Carrega histórias de todas as terras.', 'Ex-soldado que desertou e agora vive na estrada. Oferece proteção em troca de comida e abrigo.', 'Mercador itinerante que conhece todas as rotas e todos os perigos. Sempre tem algo para vender ou trocar.', 'Fugitivo disfarçado de viajante comum. Sempre alerta, sempre pronto para partir.'],
  navio: ['Marinheiro desde criança, cresceu no mar e não sabe viver em terra. O navio é seu lar.', 'Capitão que perdeu seu navio anterior em uma tempestade. Agora serve como tripulante, esperando juntar ouro para um novo barco.', 'Cozinheiro de bordo que na verdade é um espião de outro reino. Coleta informações nas docas.', 'Ex-pirata que foi perdoado em troca de serviço naval. Luta contra velhos hábitos e velhos inimigos.'],
  cemiterio: ['Coveiro que trabalha no cemitério há décadas. Viu coisas que ninguém acreditaria, mas nunca conta.', 'Clérigo que cuida dos mortos e protege os vivos das ameaças que vêm das sepulturas.', 'Sobrevivente de um ritual necromântico que deu errado. Agora vive entre os mortos, meio vivo, meio morto.', 'Acadêmico que estuda os mortos para entender a vida. Suas pesquisas o levaram a lugares sombrios.'],
  planicie: ['Fazendeiro que descobriu que suas terras escondem um segredo ancestral. Agora protege o campo de invasores.', 'Cavaleiro errante que vaga pelas planícies buscando causas justas. Sua fama o precede, para o bem e para o mal.', 'Pastora que conhece cada colina e vale. Diz-se que os ventos lhe sussurram segredos.', 'Mercador de grãos que viaja entre vilas. Conhece todas as fofocas e rumores da região.'],
  personalizado: ['Tem um passado misterioso que poucos conhecem. Viaja de lugar em lugar sem criar raízes, sempre buscando algo que nem ele entende.', 'Era alguém importante em outro lugar, mas uma tragédia mudou tudo. Agora vive uma vida simples, esperando o momento certo.', 'Cresceu em circunstâncias difíceis e aprendeu que só pode contar consigo mesmo. Apesar disso, tem um bom coração escondido sob a casca dura.', 'Chegou aqui recentemente, vindo de terras distantes. Carrega histórias incríveis e cicatrizes que contam histórias que ele prefere esquecer.'],
};

const VILLAIN_MOTIVATIONS: Record<RegionType, string[]> = {
  floresta: ['Quer queimar a floresta para revelar ruínas antigas sob ela', 'Busca controlar todos os espíritos da natureza para obter poder absoluto', 'Acredita que a civilização é um câncer e quer destruir todas as cidades próximas'],
  montanha: ['Quer despertar o dragão adormecido sob a montanha para usá-lo como arma', 'Busca monopolizar todos os minérios e escravizar os mineradores', 'Pretende causar uma erupção/avalanche para destruir um reino rival'],
  costa: ['Quer invocar um leviatã para dominar as rotas marítimas', 'Busca um artefato no fundo do mar que pode controlar as marés', 'Planeja afundar uma cidade costeira em vingança por ter sido exilado'],
  deserto: ['Quer despertar uma entidade antiga selada sob as areias', 'Busca controlar todos os oásis para subjugar os nômades', 'Pretende usar magia proibida para transformar o deserto em seu reino pessoal'],
  cidade: ['Quer derrubar o governo e instaurar uma tirania', 'Busca controlar o submundo criminoso para dominar pelo medo', 'Planeja uma peste mágica para eliminar a nobreza e tomar o poder'],
  pantano: ['Quer espalhar a corrupção do pântano para o mundo inteiro', 'Busca completar um ritual que transformará todos em mortos-vivos', 'Pretende abrir um portal para o Shadowfell no coração do pântano'],
  subterraneo: ['Quer colapsar a superfície para expandir o reino subterrâneo', 'Busca libertar uma aberração selada nas profundezas', 'Planeja usar cristais mágicos para controlar as mentes de todos no subterrâneo'],
  tundra: ['Quer invocar um inverno eterno para cobrir o mundo de gelo', 'Busca despertar um dragão branco ancestral como arma de destruição', 'Pretende sacrificar os clãs para alimentar um ritual de poder absoluto'],
  savana: ['Quer exterminar todas as bestas mágicas para absorver sua essência', 'Busca invocar uma seca eterna para controlar quem vive e quem morre', 'Pretende unir todas as tribos sob seu domínio através do medo e da magia negra'],
  vulcanico: ['Quer provocar uma super erupção para destruir civilizações inteiras', 'Busca abrir um portal permanente para o Plano do Fogo', 'Pretende se transformar em um avatar do fogo usando a energia do vulcão'],
  arquipelago: ['Quer afundar todas as ilhas para criar um reino subaquático', 'Busca invocar um kraken ancião para dominar todos os mares', 'Pretende usar magia para criar tempestades perpétuas que isolem o arquipélago'],
  ruinas: ['Quer ativar uma arma antiga das ruínas capaz de destruir cidades', 'Busca completar o ritual que a civilização antiga não terminou', 'Pretende usar o conhecimento das ruínas para reescrever a realidade'],
  acampamento: ['Quer envenenar todas as rotas de comércio', 'Busca sequestrar viajantes para um ritual macabro', 'Pretende criar uma rede de bandidos que controle todas as estradas'],
  navio: ['Quer se tornar o Rei dos Piratas dominando todos os mares', 'Busca um artefato que controla os monstros marinhos', 'Pretende destruir todos os portos para dominar o comércio marítimo'],
  cemiterio: ['Quer criar um exército de mortos-vivos invencível', 'Busca o ritual de lichdom para viver eternamente', 'Pretende abrir um portal para o Plano da Morte e inundar o mundo com mortos-vivos'],
  planicie: ['Quer queimar todas as fazendas e causar uma fome apocalíptica', 'Busca invocar uma horda de aberrações enterradas sob os campos', 'Pretende dominar todas as rotas terrestres como um senhor da guerra'],
  personalizado: ['Busca poder absoluto, não importa o custo', 'Quer vingança contra o mundo que o rejeitou', 'Acredita que só através do caos pode haver verdadeira mudança'],
};

const VILLAIN_PLANS: Record<RegionType, { phase1: string; phase2: string; final: string }[]> = {
  floresta: [{ phase1: 'Corromper os protetores da floresta um por um', phase2: 'Envenenar a fonte de vida da floresta', final: 'Realizar o ritual no coração da mata durante o eclipse' }, { phase1: 'Caçar criaturas mágicas para absorver seu poder', phase2: 'Construir um exército de autômatos de madeira', final: 'Marchar contra as cidades vizinhas com a floresta como arma' }],
  montanha: [{ phase1: 'Infiltrar-se nos clãs anões e causar discórdia', phase2: 'Tomar controle das forjas e armamentos', final: 'Usar as forjas para criar uma arma capaz de destruir montanhas' }, { phase1: 'Bloquear as passagens da montanha', phase2: 'Escravizar viajantes e mineradores', final: 'Despertar a entidade adormecida sob o pico mais alto' }],
  costa: [{ phase1: 'Recrutar piratas e contrabandistas', phase2: 'Bloquear todas as rotas comerciais', final: 'Invocar uma tempestade permanente para isolar a região' }, { phase1: 'Roubar mapas náuticos e artefatos marinhos', phase2: 'Encontrar e ativar o farol amaldiçoado', final: 'Usar o farol para atrair e afundar todas as frotas' }],
  deserto: [{ phase1: 'Envenenar os oásis um por um', phase2: 'Forçar os nômades a se submeterem por água', final: 'Abrir a tumba do rei-deus e absorver seu poder' }, { phase1: 'Reunir seguidores fanáticos', phase2: 'Encontrar os fragmentos da relíquia do sol', final: 'Transformar o deserto inteiro em um plano de fogo' }],
  cidade: [{ phase1: 'Comprar influência e chantagear nobres', phase2: 'Eliminar líderes rivais discretamente', final: 'Executar um golpe durante o festival real' }, { phase1: 'Espalhar uma doença lenta entre a população', phase2: 'Oferecer a "cura" em troca de lealdade absoluta', final: 'Revelar-se como o novo governante "salvador"' }],
  pantano: [{ phase1: 'Corromper as fontes de água da região', phase2: 'Criar um exército de mortos-vivos do pântano', final: 'Completar o ritual para fundir o plano material com o Shadowfell' }, { phase1: 'Capturar viajantes para experimentos', phase2: 'Criar quimeras usando magia e criaturas do pântano', final: 'Liberar as quimeras para devastar as terras vizinhas' }],
  subterraneo: [{ phase1: 'Dominar os túneis e controlar o trânsito', phase2: 'Encontrar e ativar os cristais de controle mental', final: 'Escravizar toda a população subterrânea e invadir a superfície' }, { phase1: 'Cavar em direção ao selo antigo', phase2: 'Enfraquecer as proteções com sacrifícios', final: 'Quebrar o selo e libertar a aberração primordial' }],
  tundra: [{ phase1: 'Corromper os xamãs dos clãs um por um', phase2: 'Canalizar o poder do inverno através de rituais', final: 'Invocar o Grande Inverno que congela tudo' }, { phase1: 'Caçar e escravizar gigantes do gelo', phase2: 'Forjar uma coroa de gelo eterno', final: 'Usar a coroa para controlar dragões brancos' }],
  savana: [{ phase1: 'Envenenar as fontes de água da savana', phase2: 'Forçar as tribos a se renderem', final: 'Sacrificar os líderes tribais para despertar uma entidade ancestral' }, { phase1: 'Caçar bestas mágicas e absorver sua essência', phase2: 'Criar um exército de quimeras', final: 'Marchar contra as civilizações vizinhas' }],
  vulcanico: [{ phase1: 'Realizar rituais de fogo no vulcão', phase2: 'Abrir fissuras de lava em toda a região', final: 'Provocar a super erupção que destruirá tudo' }, { phase1: 'Escravizar elementais de fogo', phase2: 'Construir uma fortaleza de magma', final: 'Abrir o portal para o Plano do Fogo e liberar um exército elemental' }],
  arquipelago: [{ phase1: 'Cortar as rotas entre as ilhas', phase2: 'Afundar ilhas menores como demonstração de poder', final: 'Invocar um maremoto que destrua o arquipélago' }, { phase1: 'Recrutar piratas e contrabandistas', phase2: 'Encontrar e ativar a arma ancestral submersa', final: 'Usar a arma para controlar todos os mares' }],
  ruinas: [{ phase1: 'Decifrar as inscrições de poder das ruínas', phase2: 'Reunir os fragmentos do artefato antigo', final: 'Ativar a arma ancestral que pode reescrever a realidade' }, { phase1: 'Eliminar outros exploradores e arqueólogos', phase2: 'Abrir as câmaras seladas uma por uma', final: 'Completar o ritual que a civilização antiga não terminou' }],
  acampamento: [{ phase1: 'Infiltrar-se nos grupos de viajantes', phase2: 'Roubar suprimentos e semear desconfiança', final: 'Coordenar um ataque em massa nas rotas de comércio' }, { phase1: 'Envenenar as provisões dos acampamentos', phase2: 'Sequestrar viajantes importantes', final: 'Exigir resgate e poder político' }],
  navio: [{ phase1: 'Amotinar tripulações de outros navios', phase2: 'Formar uma frota pirata', final: 'Atacar e conquistar todos os portos' }, { phase1: 'Encontrar mapas de artefatos marinhos', phase2: 'Recuperar a arma submarina ancestral', final: 'Usar a arma para submeter todas as nações costeiras' }],
  cemiterio: [{ phase1: 'Profanar túmulos e coletar componentes necromânticos', phase2: 'Criar um exército de mortos-vivos', final: 'Abrir as portas da morte e inundar o mundo com mortos' }, { phase1: 'Estudar rituais de lichdom', phase2: 'Realizar sacrifícios para acumular poder', final: 'Completar a transformação em lich e se tornar imortal' }],
  planicie: [{ phase1: 'Envenenar os campos e destruir colheitas', phase2: 'Causar fome e desespero', final: 'Oferecer salvação em troca de submissão absoluta' }, { phase1: 'Recrutar bandidos e desertores', phase2: 'Controlar todas as estradas e rotas', final: 'Se declarar senhor da guerra e dominar a região' }],
  personalizado: [{ phase1: 'Reunir aliados e recursos em segredo', phase2: 'Eliminar oposição e consolidar poder', final: 'Executar o plano final com força esmagadora' }, { phase1: 'Estudar magia proibida e ganhar poder', phase2: 'Testar o poder em alvos menores', final: 'Desencadear destruição em escala catastrófica' }],
};

const HIDDEN_WEAKNESSES = [
  'Tem pavor de um som específico que o paralisa',
  'Um amuleto da infância é o foco de todo seu poder — sem ele, perde metade da força',
  'Ama secretamente alguém do grupo dos heróis',
  'Tem uma doença terminal que o enfraquece gradualmente',
  'Seu poder depende de um pacto — quebrar o pacto o destrói',
  'É vulnerável a um tipo específico de magia (divina/natural/arcana)',
  'Tem um servo leal que, se convencido, trairia o vilão',
  'Seu plano depende de um ingrediente raro que pode ser destruído',
  'Tem memórias suprimidas de quem ele era antes — podem ser restauradas',
  'Existe uma profecia que descreve exatamente como ele será derrotado',
  'É arrogante demais para considerar que pode perder',
  'Sua fortaleza tem uma falha estrutural que poucos conhecem',
];

// --- GENERATORS ---

function getCurrentRegion(): RegionType {
  try {
    const stored = localStorage.getItem('arcanum-environment');
    if (stored) {
      const env = JSON.parse(stored);
      if (env.region && REGION_LABELS[env.region as RegionType]) {
        return env.region as RegionType;
      }
    }
  } catch {}
  return 'cidade';
}

function generateNPC(region: RegionType): NPC {
  return {
    id: crypto.randomUUID(),
    name: pick(NAMES_BY_REGION[region]),
    race: pick(RACES_BY_REGION[region]),
    npcClass: pick(CLASSES_BY_REGION[region]),
    personality: pick(PERSONALITIES),
    quirk: pick(QUIRKS),
    occupation: pick(OCCUPATIONS_BY_REGION[region]),
    secret: pick(SECRETS_BY_REGION[region]),
    objective: pick(OBJECTIVES_BY_REGION[region]),
    backstory: pick(BACKSTORIES_BY_REGION[region]),
    hp: rollDice(2, 10, 5),
    ac: rollDice(1, 6, 8),
    region,
    isVillain: false,
    fear: pick(FEARS),
    desire: pick(DESIRES),
    hatred: pick(HATREDS),
    ambition: pick(AMBITIONS),
    memory: pick(MEMORIES),
  };
}

function generateVillain(region: RegionType): Villain {
  const plan = pick(VILLAIN_PLANS[region]);
  const weaknessCount = Math.random() < 0.5 ? 2 : 3;
  const shuffled = [...HIDDEN_WEAKNESSES].sort(() => Math.random() - 0.5);

  return {
    id: crypto.randomUUID(),
    name: pick(NAMES_BY_REGION[region]),
    race: pick(RACES_BY_REGION[region]),
    npcClass: pick(CLASSES_BY_REGION[region]),
    personality: pick(PERSONALITIES),
    quirk: pick(QUIRKS),
    occupation: pick(OCCUPATIONS_BY_REGION[region]),
    secret: pick(SECRETS_BY_REGION[region]),
    objective: pick(OBJECTIVES_BY_REGION[region]),
    backstory: pick(BACKSTORIES_BY_REGION[region]),
    hp: rollDice(4, 12, 20),
    ac: rollDice(1, 4, 14),
    region,
    isVillain: true,
    motivation: pick(VILLAIN_MOTIVATIONS[region]),
    planPhase1: plan.phase1,
    planPhase2: plan.phase2,
    planFinal: plan.final,
    hiddenWeaknesses: shuffled.slice(0, weaknessCount),
    fear: pick(FEARS),
    desire: pick(DESIRES),
    hatred: pick(HATREDS),
    ambition: pick(AMBITIONS),
    memory: pick(MEMORIES),
  };
}

// --- COMPONENT ---

const NPCGenerator = () => {
  const [current, setCurrent] = useState<Character | null>(null);
  const [saved, setSaved] = useLocalStorage<Character[]>('arcanum-npcs', []);
  const [region, setRegion] = useState<RegionType>(getCurrentRegion);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Sync region from environment
  useEffect(() => {
    const sync = () => setRegion(getCurrentRegion());
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  const generate = (villain: boolean) => setCurrent(villain ? generateVillain(region) : generateNPC(region));
  const saveChar = () => {
    if (current) {
      setSaved(prev => [current, ...prev]);
      setCurrent(null);
    }
  };
  const remove = (id: string) => setSaved(prev => prev.filter(n => n.id !== id));

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const EmotionRow = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
    <div className={`flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/30 border border-border/30`}>
      <span className={`shrink-0 mt-0.5 ${color}`}>{icon}</span>
      <div>
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        <span className="text-muted-foreground">{value}</span>
      </div>
    </div>
  );

  const CharacterCard = ({ char, actions }: { char: Character; actions: React.ReactNode }) => {
    const isExpanded = expandedCards.has(char.id);
    const secretVisible = revealedSecrets.has(char.id);

    return (
      <Card className={`card-hover ${char.isVillain ? 'border-destructive/40' : ''}`}>
        <CardContent className="p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {char.isVillain && <Skull className="w-5 h-5 text-destructive shrink-0" />}
              <h3 className="text-xl font-display font-bold truncate">{char.name}</h3>
              <Badge variant={char.isVillain ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                {REGION_LABELS[char.region]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {actions}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-destructive" />
              <span className="font-semibold">{char.hp} HP</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">CA {char.ac}</span>
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div><span className="text-muted-foreground">Raça:</span> {char.race}</div>
            <div><span className="text-muted-foreground">Classe:</span> {char.npcClass}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Ocupação:</span> {char.occupation}</div>
          </div>

          <div className="text-sm"><span className="text-muted-foreground">Personalidade:</span> {char.personality}</div>
          <div className="text-sm"><span className="text-muted-foreground">Peculiaridade:</span> {char.quirk}</div>

          {/* Emotions Section - always visible */}
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <h4 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">Psicologia</h4>
            <div className="grid grid-cols-1 gap-1.5">
              <EmotionRow icon={<Flame className="w-3.5 h-3.5" />} label="Medo" value={char.fear} color="text-orange-400" />
              <EmotionRow icon={<Heart className="w-3.5 h-3.5" />} label="Desejo" value={char.desire} color="text-pink-400" />
              <EmotionRow icon={<Zap className="w-3.5 h-3.5" />} label="Ódio" value={char.hatred} color="text-red-400" />
              <EmotionRow icon={<Crown className="w-3.5 h-3.5" />} label="Ambição" value={char.ambition} color="text-amber-400" />
              <EmotionRow icon={<BookOpen className="w-3.5 h-3.5" />} label="Memória" value={char.memory} color="text-blue-400" />
            </div>
          </div>

          {/* Expandable section */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs"
            onClick={() => toggleExpand(char.id)}
          >
            {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {isExpanded ? 'Menos detalhes' : 'Mais detalhes'}
          </Button>

          {isExpanded && (
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="text-sm">
                <span className="text-muted-foreground flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3" /> Objetivo:
                </span>
                {char.objective}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">História:</span>
                <p className="mt-1 text-foreground/80 italic">{char.backstory}</p>
              </div>

              {/* Secret - hidden by default */}
              <div className="text-sm">
                <button
                  onClick={() => toggleSecret(char.id)}
                  className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
                >
                  {secretVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span className="font-semibold">Segredo</span>
                </button>
                {secretVisible && <p className="mt-1 text-accent">{char.secret}</p>}
              </div>

              {/* Villain-specific */}
              {char.isVillain && (
                <div className="space-y-3 pt-2 border-t border-destructive/20">
                  <h4 className="text-sm font-display font-bold text-destructive flex items-center gap-1">
                    <Skull className="w-4 h-4" /> Ficha de Vilão
                  </h4>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Motivação:</span>
                    <p className="mt-1 text-destructive/90">{char.motivation}</p>
                  </div>

                  <div className="text-sm space-y-2">
                    <span className="text-muted-foreground">Plano:</span>
                    <div className="ml-2 space-y-1.5">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0 text-xs">Fase 1</Badge>
                        <span>{char.planPhase1}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0 text-xs">Fase 2</Badge>
                        <span>{char.planPhase2}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="destructive" className="shrink-0 text-xs">Final</Badge>
                        <span>{char.planFinal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <button
                      onClick={() => toggleSecret(char.id + '-weak')}
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      {revealedSecrets.has(char.id + '-weak') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span className="font-semibold">Fraquezas Ocultas</span>
                    </button>
                    {revealedSecrets.has(char.id + '-weak') && (
                      <ul className="mt-1 space-y-1 ml-4 list-disc text-primary/90">
                        {char.hiddenWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const savedNPCs = saved.filter(c => !c.isVillain);
  const savedVillains = saved.filter(c => c.isVillain);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Gerador de NPC</h1>
          <p className="text-sm text-muted-foreground">
            Região atual: <span className="text-primary font-semibold">{REGION_LABELS[region]}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generate(false)}>
            <Sparkles className="w-4 h-4 mr-2" />NPC
          </Button>
          <Button variant="destructive" onClick={() => generate(true)}>
            <Skull className="w-4 h-4 mr-2" />Vilão
          </Button>
        </div>
      </div>

      {current && (
        <CharacterCard char={current} actions={
          <Button size="sm" onClick={saveChar}><Save className="w-3 h-3 mr-1" />Salvar</Button>
        } />
      )}

      {saved.length > 0 && (
        <Tabs defaultValue="npcs" className="mt-6">
          <TabsList>
            <TabsTrigger value="npcs">
              <UserPlus className="w-4 h-4 mr-1" />NPCs ({savedNPCs.length})
            </TabsTrigger>
            <TabsTrigger value="villains">
              <Skull className="w-4 h-4 mr-1" />Vilões ({savedVillains.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="npcs">
            {savedNPCs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedNPCs.map(npc => (
                  <CharacterCard key={npc.id} char={npc} actions={
                    <Button variant="ghost" size="icon" onClick={() => remove(npc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  } />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum NPC salvo ainda</p>
            )}
          </TabsContent>

          <TabsContent value="villains">
            {savedVillains.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVillains.map(v => (
                  <CharacterCard key={v.id} char={v} actions={
                    <Button variant="ghost" size="icon" onClick={() => remove(v.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  } />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum vilão salvo ainda</p>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!current && saved.length === 0 && (
        <Card className="card-hover">
          <CardContent className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Gere um NPC ou Vilão baseado na região atual do ambiente</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NPCGenerator;
