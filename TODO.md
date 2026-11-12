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
- [ ] Adicionar ataques, dano, crítico, inventário mecânico e efeitos configuráveis na próxima fase.
