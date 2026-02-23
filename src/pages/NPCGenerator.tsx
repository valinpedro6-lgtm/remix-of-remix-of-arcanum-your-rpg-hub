import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus, Save, Trash2, Sparkles, Shield, Heart, Target,
  Skull, Eye, EyeOff, ChevronDown, ChevronUp, Swords
} from 'lucide-react';

// --- TYPES ---

type RegionType = 'floresta' | 'montanha' | 'costa' | 'deserto' | 'cidade' | 'pantano' | 'subterraneo' | 'personalizado';

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
  cidade: 'Cidade', pantano: 'Pântano', subterraneo: 'Subterrâneo', personalizado: 'Personalizado',
};

const NAMES_BY_REGION: Record<RegionType, string[]> = {
  floresta: ['Thalion', 'Elowen', 'Faenor', 'Miriel', 'Silvanus', 'Brenna', 'Arden', 'Lirael', 'Oakhart', 'Ivy'],
  montanha: ['Thorin', 'Brunhild', 'Grimjaw', 'Helga', 'Stoneforge', 'Ulfgar', 'Magna', 'Krag', 'Ingrid', 'Balric'],
  costa: ['Coralia', 'Nereus', 'Marina', 'Tritão', 'Ondina', 'Pescador', 'Gaivota', 'Maré', 'Âncora', 'Sirena'],
  deserto: ['Zahir', 'Amira', 'Khalid', 'Safira', 'Rashid', 'Nadir', 'Layla', 'Tarik', 'Jamila', 'Darius'],
  cidade: ['Alaric', 'Beatriz', 'Cedric', 'Dahlia', 'Edmund', 'Fiona', 'Gareth', 'Helena', 'Leopold', 'Viviane'],
  pantano: ['Boggart', 'Murk', 'Fenn', 'Sombria', 'Musgo', 'Raíz', 'Lodo', 'Cobra', 'Vaporia', 'Turfa'],
  subterraneo: ['Shade', 'Nyx', 'Obsidian', 'Ônix', 'Umbra', 'Cinza', 'Eco', 'Vírion', 'Nethys', 'Profunda'],
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
  personalizado: [
    'É um espião de outro reino', 'Possui uma dívida impagável', 'Fez um pacto com um demônio',
    'Está fugindo de uma guilda de assassinos', 'Guarda um artefato perigoso', 'Conhece uma masmorra antiga',
  ],
};

const OBJECTIVES_BY_REGION: Record<RegionType, string[]> = {
  floresta: [
    'Proteger a floresta de invasores', 'Encontrar uma erva lendária para curar uma doença',
    'Descobrir por que os animais estão fugindo', 'Vingar a destruição de sua aldeia',
    'Estabelecer um santuário de criaturas mágicas', 'Recuperar um artefato druídico roubado',
  ],
  montanha: [
    'Reclamar uma fortaleza anã perdida', 'Encontrar o túmulo de um herói lendário',
    'Descobrir a fonte dos tremores recentes', 'Acumular riqueza para libertar seu clã',
    'Escalar o pico mais alto em busca de iluminação', 'Forjar a arma definitiva',
  ],
  costa: [
    'Encontrar um navio lendário naufragado', 'Proteger a vila de piratas',
    'Descobrir o que está matando os peixes', 'Construir uma frota e explorar terras distantes',
    'Recuperar algo perdido no fundo do mar', 'Estabelecer uma rota comercial lucrativa',
  ],
  deserto: [
    'Encontrar o oásis perdido', 'Unir as tribos nômades contra uma ameaça',
    'Recuperar uma relíquia de uma pirâmide', 'Escapar de uma maldição do deserto',
    'Construir um assentamento permanente', 'Descobrir a verdade sobre ruínas enterradas',
  ],
  cidade: [
    'Subir na hierarquia política', 'Desmascarar um conspirador na corte',
    'Abrir o melhor estabelecimento da cidade', 'Encontrar um ente querido desaparecido',
    'Limpar seu nome de uma acusação falsa', 'Infiltrar-se na guilda de ladrões',
  ],
  pantano: [
    'Encontrar a cura para a maldição do pântano', 'Expulsar as criaturas que invadem sua terra',
    'Localizar um artefato perdido na lama', 'Descobrir a origem de luzes estranhas no pântano',
    'Proteger um vilarejo isolado', 'Negociar paz com as criaturas do pântano',
  ],
  subterraneo: [
    'Encontrar a saída para a superfície', 'Reclamar território de outras facções',
    'Descobrir o que está causando colapsos nos túneis', 'Roubar um tesouro guardado por aberrações',
    'Estabelecer uma rota de comércio subterrânea', 'Selar uma fenda planar nas profundezas',
  ],
  personalizado: [
    'Buscar poder a qualquer custo', 'Encontrar um artefato lendário',
    'Proteger alguém importante', 'Vingar-se de quem o traiu',
    'Descobrir a verdade sobre seu passado', 'Construir algo grandioso',
  ],
};

const BACKSTORIES_BY_REGION: Record<RegionType, string[]> = {
  floresta: [
    'Cresceu entre os elfos da floresta após ser abandonado quando bebê. Aprendeu a língua dos animais e a ler os sinais da natureza.',
    'Era um lenhador até o dia em que cortou uma árvore sagrada. Desde então, busca redenção servindo como protetor da mata.',
    'Sobrevivente de um incêndio florestal que destruiu sua aldeia. Vive sozinho, desconfiado de forasteiros.',
    'Foi aprendiz de um druida poderoso que desapareceu misteriosamente. Busca respostas nas profundezas da floresta.',
  ],
  montanha: [
    'Nasceu em uma fortaleza anã nas profundezas da montanha. Deixou seu lar após um desentendimento com o conselho de anciãos.',
    'Era um pastor de cabras até encontrar uma caverna com escrituras antigas. Desde então, estuda os segredos da montanha.',
    'Sobrevivente de uma avalanche que soterrou toda sua vila. Carrega a culpa de ser o único sobrevivente.',
    'Treinou como monge em um monastério no pico da montanha. Desceu para cumprir uma missão sagrada.',
  ],
  costa: [
    'Filho de pescadores, cresceu ouvindo lendas do mar. Um dia, viu algo no fundo do oceano que mudou sua vida para sempre.',
    'Era marinheiro em um navio mercante até um naufrágio. Foi salvo por criaturas marinhas e agora protege a costa.',
    'Cresceu em um farol isolado com apenas livros como companhia. Conhece todas as histórias do mar, mas nunca navegou.',
    'Ex-pirata que abandonou a vida de crimes após uma tempestade que quase o matou. Agora vive uma vida pacata, mas o passado o persegue.',
  ],
  deserto: [
    'Nasceu em uma caravana nômade que cruzava o grande deserto. Conhece cada duna e oásis como a palma de sua mão.',
    'Era guarda de um sultão até descobrir seus planos sombrios. Fugiu para o deserto e agora vive como exilado.',
    'Encontrou uma relíquia antiga enterrada na areia que lhe concedeu visões do passado. Busca entender seu significado.',
    'Cresceu em um oásis isolado, acreditando que o deserto era o mundo inteiro. Descobriu a verdade e agora explora.',
  ],
  cidade: [
    'Cresceu nas ruas da cidade, aprendendo a sobreviver com astúcia. Agora quer ser alguém respeitável, mas o passado insiste em voltar.',
    'Herdeiro de uma família nobre em decadência. Mantém aparências enquanto busca restaurar a fortuna familiar.',
    'Era aprendiz de um mago da academia até um experimento dar errado. Foi expulso e agora trabalha como artesão.',
    'Chegou à cidade fugindo de um passado sombrio. Construiu uma nova identidade, mas vive com medo de ser descoberto.',
  ],
  pantano: [
    'Nasceu e cresceu no pântano, em uma comunidade isolada que adora espíritos antigos. Foi exilado por questionar as tradições.',
    'Era um estudioso que veio pesquisar o pântano e nunca mais conseguiu sair. Algo o prende aqui, algo que ele não entende.',
    'Sobrevivente de uma expedição que deu errado. Todos morreram, menos ele. Agora vive no pântano, meio louco, meio sábio.',
    'Curandeiro que usa as plantas raras do pântano. É respeitado e temido em igual medida pelos poucos que vivem aqui.',
  ],
  subterraneo: [
    'Nasceu na escuridão e nunca viu a luz do sol. Conhece os túneis como ninguém e tem uma aversão profunda à superfície.',
    'Era um minerador até encontrar uma caverna com cristais que sussurram. Desde então, ouve vozes que guiam seus passos.',
    'Fugiu da superfície após cometer um crime terrível. Encontrou refúgio no subterrâneo, mas a culpa nunca o abandonou.',
    'Membro de uma expedição de exploração que ficou preso quando os túneis colapsaram. Adaptou-se e fez do subterrâneo seu lar.',
  ],
  personalizado: [
    'Tem um passado misterioso que poucos conhecem. Viaja de lugar em lugar sem criar raízes, sempre buscando algo que nem ele entende.',
    'Era alguém importante em outro lugar, mas uma tragédia mudou tudo. Agora vive uma vida simples, esperando o momento certo.',
    'Cresceu em circunstâncias difíceis e aprendeu que só pode contar consigo mesmo. Apesar disso, tem um bom coração escondido sob a casca dura.',
    'Chegou aqui recentemente, vindo de terras distantes. Carrega histórias incríveis e cicatrizes que contam histórias que ele prefere esquecer.',
  ],
};

// Villain-specific data
const VILLAIN_MOTIVATIONS: Record<RegionType, string[]> = {
  floresta: [
    'Quer queimar a floresta para revelar ruínas antigas sob ela',
    'Busca controlar todos os espíritos da natureza para obter poder absoluto',
    'Acredita que a civilização é um câncer e quer destruir todas as cidades próximas',
  ],
  montanha: [
    'Quer despertar o dragão adormecido sob a montanha para usá-lo como arma',
    'Busca monopolizar todos os minérios e escravizar os mineradores',
    'Pretende causar uma erupção/avalanche para destruir um reino rival',
  ],
  costa: [
    'Quer invocar um leviatã para dominar as rotas marítimas',
    'Busca um artefato no fundo do mar que pode controlar as marés',
    'Planeja afundar uma cidade costeira em vingança por ter sido exilado',
  ],
  deserto: [
    'Quer despertar uma entidade antiga selada sob as areias',
    'Busca controlar todos os oásis para subjugar os nômades',
    'Pretende usar magia proibida para transformar o deserto em seu reino pessoal',
  ],
  cidade: [
    'Quer derrubar o governo e instaurar uma tirania',
    'Busca controlar o submundo criminoso para dominar pelo medo',
    'Planeja uma peste mágica para eliminar a nobreza e tomar o poder',
  ],
  pantano: [
    'Quer espalhar a corrupção do pântano para o mundo inteiro',
    'Busca completar um ritual que transformará todos em mortos-vivos',
    'Pretende abrir um portal para o Shadowfell no coração do pântano',
  ],
  subterraneo: [
    'Quer colapsar a superfície para expandir o reino subterrâneo',
    'Busca libertar uma aberração selada nas profundezas',
    'Planeja usar cristais mágicos para controlar as mentes de todos no subterrâneo',
  ],
  personalizado: [
    'Busca poder absoluto, não importa o custo',
    'Quer vingança contra o mundo que o rejeitou',
    'Acredita que só através do caos pode haver verdadeira mudança',
  ],
};

const VILLAIN_PLANS: Record<RegionType, { phase1: string; phase2: string; final: string }[]> = {
  floresta: [
    { phase1: 'Corromper os protetores da floresta um por um', phase2: 'Envenenar a fonte de vida da floresta', final: 'Realizar o ritual no coração da mata durante o eclipse' },
    { phase1: 'Caçar criaturas mágicas para absorver seu poder', phase2: 'Construir um exército de autômatos de madeira', final: 'Marchar contra as cidades vizinhas com a floresta como arma' },
  ],
  montanha: [
    { phase1: 'Infiltrar-se nos clãs anões e causar discórdia', phase2: 'Tomar controle das forjas e armamentos', final: 'Usar as forjas para criar uma arma capaz de destruir montanhas' },
    { phase1: 'Bloquear as passagens da montanha', phase2: 'Escravizar viajantes e mineradores', final: 'Despertar a entidade adormecida sob o pico mais alto' },
  ],
  costa: [
    { phase1: 'Recrutar piratas e contrabandistas', phase2: 'Bloquear todas as rotas comerciais', final: 'Invocar uma tempestade permanente para isolar a região' },
    { phase1: 'Roubar mapas náuticos e artefatos marinhos', phase2: 'Encontrar e ativar o farol amaldiçoado', final: 'Usar o farol para atrair e afundar todas as frotas' },
  ],
  deserto: [
    { phase1: 'Envenenar os oásis um por um', phase2: 'Forçar os nômades a se submeterem por água', final: 'Abrir a tumba do rei-deus e absorver seu poder' },
    { phase1: 'Reunir seguidores fanáticos', phase2: 'Encontrar os fragmentos da relíquia do sol', final: 'Transformar o deserto inteiro em um plano de fogo' },
  ],
  cidade: [
    { phase1: 'Comprar influência e chantagear nobres', phase2: 'Eliminar líderes rivais discretamente', final: 'Executar um golpe durante o festival real' },
    { phase1: 'Espalhar uma doença lenta entre a população', phase2: 'Oferecer a "cura" em troca de lealdade absoluta', final: 'Revelar-se como o novo governante "salvador"' },
  ],
  pantano: [
    { phase1: 'Corromper as fontes de água da região', phase2: 'Criar um exército de mortos-vivos do pântano', final: 'Completar o ritual para fundir o plano material com o Shadowfell' },
    { phase1: 'Capturar viajantes para experimentos', phase2: 'Criar quimeras usando magia e criaturas do pântano', final: 'Liberar as quimeras para devastar as terras vizinhas' },
  ],
  subterraneo: [
    { phase1: 'Dominar os túneis e controlar o trânsito', phase2: 'Encontrar e ativar os cristais de controle mental', final: 'Escravizar toda a população subterrânea e invadir a superfície' },
    { phase1: 'Cavar em direção ao selo antigo', phase2: 'Enfraquecer as proteções com sacrifícios', final: 'Quebrar o selo e libertar a aberração primordial' },
  ],
  personalizado: [
    { phase1: 'Reunir aliados e recursos em segredo', phase2: 'Eliminar oposição e consolidar poder', final: 'Executar o plano final com força esmagadora' },
    { phase1: 'Estudar magia proibida e ganhar poder', phase2: 'Testar o poder em alvos menores', final: 'Desencadear destruição em escala catastrófica' },
  ],
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
      return env.region || 'cidade';
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
          <h1 className="text-3xl font-display font-bold">Gerador de NPC</h1>
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
