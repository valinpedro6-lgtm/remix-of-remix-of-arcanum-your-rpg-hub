# Entregas

- [x] O usuário consegue criar uma campanha com título, gênero, sistema, tom, premissa e objetivo.
- [x] O usuário consegue adicionar, editar e excluir capítulos, mantendo um capítulo selecionado como foco de escrita.
- [x] O usuário consegue manter personagens, locais e itens da história em coleções editáveis.
- [x] O usuário consegue registrar eventos em uma linha do tempo ordenável por data.
- [x] O estúdio salva alterações automaticamente no aparelho e informa o estado salvo.
- [x] O usuário consegue exportar o projeto da história em JSON.
- [x] O fluxo é acessível a partir da navegação e funciona em telas estreitas e largas.
- [x] A home apresenta a criação de histórias como ação principal sem remover as ferramentas existentes.

## Expansão avançada do Tabletop

- [x] O mestre consegue definir e avançar a ordem de turnos; a mesa mostra claramente o turno ativo e o round.
- [x] O mestre consegue aplicar condições a tokens com duração em rodadas; o sistema reduz ou remove a duração ao avançar o turno.
- [ ] O link público suporta três papéis separados: mestre, jogador e observador, com validação server-side.
- [ ] O fog of war pode ser associado à visão de tokens autorizados sem revelar áreas escondidas ao jogador.
- [x] O jogador consegue continuar vendo e salvando ações permitidas durante oscilações de rede.
- [ ] O mestre consegue controlar NPCs e iniciar encontros gerados a partir de parâmetros simples.
- [ ] O usuário consegue gerar nomes, cidades e ganchos e revisar o resultado antes de salvar.
- [ ] A campanha possui diário compartilhado, convites com permissão e exportação PDF.
- [ ] A IA gera NPCs e missões como rascunho editável, exigindo confirmação explícita antes de persistir.

## Automação de fichas — fase inicial

- [x] A ficha mantém atributos, perícias e recursos estruturados no Supabase existente.
- [x] O usuário consegue rolar atributos e perícias diretamente na ficha.
- [x] A ficha calcula e mostra iniciativa, percepção, defesa e carga sem apagar valores manuais.
- [x] A última rolagem é salva no Supabase, aparece para o mestre e é validada no endpoint público.
- [x] A automação funciona na ficha privada e no link público compartilhado.
- [x] A rolagem de atributos e perícias funciona em todos os sistemas disponíveis, com derivados adaptados por sistema quando aplicável.
- [x] Cada sistema possui catálogo, atributo ligado, grau/dado e modelo de rolagem próprios; esses campos podem ser editados pelo mestre.
- [ ] Adicionar ataques, dano, crítico, inventário mecânico e efeitos configuráveis na próxima fase.

## Redesign profissional do produto
- [x] A navegação agrupa claramente Visão geral, Preparar, Mesa ao vivo, Biblioteca e Administração, mantendo as rotas existentes funcionais.
- [x] O desktop apresenta um shell de produto profissional com sidebar legível, estado ativo evidente e hierarquia de ações consistente.
- [x] O mobile apresenta apenas ações principais no rodapé e acesso contextual às demais áreas pelo menu, sem uma lista confusa de ferramentas.
- [x] O sistema visual usa azul-petróleo para estado ativo, âmbar para atenção e vermelho reservado para perigo, mantendo a identidade de cada sistema de ficha dentro da casca do produto.
- [x] As telas principais apresentam cabeçalhos, espaçamento e superfícies consistentes, sem alterar dados de fichas, tabletop, biblioteca ou acesso do mestre.

## Correção visual e cálculos da ficha

- [x] No modo “Projetor”, o topo da ficha — incluindo nome e origem/classe — permanece visível e legível; em telas móveis, a ficha inteira pode ser rolada e o modo pode ser encerrado mesmo quando o navegador não oferece tela cheia nativa.
- [x] Em Ordem Paranormal, iniciativa e percepção mostram o bônus da perícia sem somar Agilidade/Presença como bônus fixo (o exemplo correto é +5, não +6/+7); grau, lista, botões e rolagens usam valores coerentes.
- [x] As validações foram executadas localmente sem ler, gravar ou carregar dados do banco.
