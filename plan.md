# Plano — Arcanum RPG

## Objetivo
Transformar o Arcanum em um hub confortável no celular e no PC, adicionando um Estúdio de História que organize uma campanha em capítulos, personagens, locais, itens e linha do tempo.

## Implementação
- Criar `StoryStudio` em React com persistência automática no `localStorage`, sem depender de uma nova migração de banco.
- Modelar uma campanha como metadados + capítulos + entidades de mundo + eventos da linha do tempo.
- Expor rotas e navegação para abrir o estúdio rapidamente.
- Ajustar o shell visual: root em largura total, espaçamento seguro para notch, navegação mobile persistente e áreas de toque maiores.
- Adicionar exportação JSON para backup e compartilhamento manual do projeto.

## Estrutura
- `src/pages/StoryStudio.tsx`: fluxo de criação e edição da história.
- `src/lib/storyStudio.ts`: tipos, dados iniciais e utilitários de download.
- `src/components/Layout.tsx`: navegação desktop/mobile e atalho do estúdio.
- `src/pages/Index.tsx`: entrada de destaque para começar uma história.
- `src/index.css` e `src/App.css`: responsividade e remoção dos estilos Vite de exemplo.

## Direção visual
- **Estilos considerados:** grimório editorial (0,06), painel tático neon (0,08), oficina de campanha acolhedora (0,86).
- **Escolhido — oficina de campanha acolhedora:** uma ferramenta de mestre com calor de pergaminho digital, hierarquia clara e foco no conteúdo.
- **Princípios:** leitura confortável, ação primária óbvia, densidade adaptável e contexto sempre visível.
- **Paleta:** mantém os temas existentes; primário destaca criação e progresso, enquanto superfícies translúcidas separam áreas sem parecerem caixas pesadas.
- **Layout:** cabeçalho contextual, coluna de navegação compacta e tela de trabalho em duas áreas no desktop que vira fluxo vertical no celular.
- **Assinaturas:** marcador de capítulo, chips de entidades e linha do tempo vertical.
- **Interação:** autosave silencioso, feedback de estado e ações de toque de no mínimo 44px.
- **Tipografia:** Cinzel nos títulos e Rajdhani no corpo, mantendo a identidade Arcanum.
- **Marca:** Arcanum é o caderno de campanha digital para mestres que querem sair da ideia solta e chegar a uma aventura jogável.

## Restrições
A primeira versão usa armazenamento local, preservando o funcionamento imediato do projeto existente e permitindo exportar os dados antes de uma futura sincronização em nuvem.

# Roadmap — recursos avançados do Tabletop

## Direção
Ampliar o Tabletop sem quebrar fichas, mapas, links públicos ou a separação por proprietário. Toda mudança compartilhada deve ser validada no endpoint Supabase, não apenas no React.

## Fase 1 — base segura do Tabletop
- Permissões explícitas para mestre, jogador e observador.
- Turno atual, ordem de iniciativa e avanço automático/manual.
- Condições por token com duração em rodadas e remoção segura.
- Estrutura de visão por token e modo de fog of war compatível com o link público.
- Reconexão e salvamento resiliente preservados.

## Fase 2 — ferramentas de jogo
- Linha de visão e alcance real usando posição, alcance e obstáculos.
- NPCs controlados pelo mestre.
- Gerador de encontros.
- Gerador de nomes, cidades e ganchos.

## Fase 3 — campanha e distribuição
- Diário compartilhado da campanha.
- Convites por código ou link com permissões.
- Exportação da aventura em PDF.
- IA para criar NPCs e missões, sempre com edição e confirmação do mestre antes de salvar.

## Organização técnica
- `src/pages/Tabletop.tsx`: controles do mestre e estado visual da mesa.
- `src/pages/SharedTabletop.tsx`: experiência pública de jogador/observador.
- `supabase/functions/shared-tabletop/index.ts`: leitura, atualização e autorização server-side.
- `drizzle/migrations/`: evolução reproduzível do schema.
- `src/lib/network.ts`: retries e estado de conexão.

## Design da expansão
**Grimório tático cinematográfico.** Painel assimétrico, mapa em destaque, chips de estado, marcadores de turno sobre a cena e condições como selos compactos. Carvão e vinho formam o mundo; âmbar sinaliza turno e atenção; verde discreto confirma sincronização.

## Automação de fichas — fase inicial
A ficha continua usando o Supabase atual como fonte de dados. O motor `src/lib/sheetAutomation.ts` calcula valores derivados sem sobrescrever atributos ou recursos existentes, enquanto `SheetAutomation` oferece rolagens de atributos, perícias, iniciativa e percepção. O último resultado é salvo no campo `last_roll` e aparece tanto na ficha do jogador quanto na visão do mestre. O endpoint `user-data` valida e limita esse payload antes de persistir.

Os cálculos derivados agora usam perfis por sistema para Ordem Paranormal, D&D 5e, Tormenta20, Pathfinder 2e, Call of Cthulhu, Cyberpunk RED e um fallback genérico para os demais sistemas. A rolagem de atributos e perícias permanece universal.

Na próxima evolução, o modelo comum preserva `ruleset_id`, versão/edição, dados de atributo, atributo ligado à perícia, grau/proficiência, especialização, modificadores e overrides. A implementação atual já usa o catálogo e o modelo de rolagem próprios de cada sistema, sem converter automaticamente uma ficha entre edições.


# Fase atual — Reorganização profissional do produto

## Objetivo
Transformar o Arcanum em um workspace premium de RPG: a pessoa deve entender onde preparar a campanha, onde conduzir a sessão e onde administrar conteúdo sem navegar por uma lista longa de ferramentas desconectadas.

## Arquitetura proposta
- **Visão geral**: Início e Painel, com resumo da campanha, atalhos e estado atual da mesa.
- **Preparar**: Histórias, Elenco, Geradores e Mapa Mental.
- **Mesa ao vivo**: Mesa, Tabletop e Notas.
- **Biblioteca**: Compêndio e Biblioteca quando disponível.
- **Administração**: Mestre e backup, apenas para o mestre.

As rotas antigas permanecem funcionando por redirecionamento. A mudança reorganiza a navegação e os agrupamentos, sem apagar funcionalidades.

## Direção visual escolhida
**Command Deck premium com detalhes de Dark Grimoire.** Um dashboard editorial de software premium misturado com uma sala de comando de campanha.

Princípios: hierarquia evidente; ações importantes sempre visíveis; densidade controlada; cada sistema de RPG mantém sua cor, mas o produto tem uma casca única.

Paleta: carvão quase preto como base, azul-esverdeado de sinal para estado ativo, âmbar para atenção e vermelho reservado para perigo. O vermelho deixa de ser a cor padrão de tudo para evitar aparência agressiva.

Layout: navegação lateral larga e compacta no desktop, barra inferior contextual no mobile e conteúdo em faixas de trabalho com cabeçalhos e status.

Assinaturas: marca ARC em monograma; linhas de status e pequenos rótulos editoriais; superfícies com borda fina e brilho discreto, sem excesso de glow.

Interação: cada tela começa com uma decisão clara. Ações primárias usam um único destaque. Ações destrutivas ficam afastadas.

Animação: entradas curtas de 160–240ms, hover com deslocamento mínimo e nenhum movimento contínuo fora de estados importantes.

Tipografia: Cinzel apenas para marca e títulos; Rajdhani para interface e dados; Cormorant apenas em fichas e conteúdo narrativo.

Essência: uma central de campanha profissional para preparar, narrar e acompanhar RPG ao vivo. Personalidade: preciso, atmosférico, confiável.

## Implementação desta fase
1. Reorganizar a navegação em grupos sem alterar rotas.
2. Criar navegação contextual no mobile, reduzindo a lista de itens soltos.
3. Ajustar tokens globais para o azul-petróleo como estado de produto e reservar vermelho para perigo.
4. Refinar sidebar, cabeçalho e espaçamento do shell.
5. Validar compilação e publicar sem tocar nos dados de fichas, tabletop ou acesso.

## Estrutura do projeto
- `src/components/Layout.tsx`: shell, navegação desktop/mobile e grupos.
- `src/index.css`: tokens, superfícies, tipografia e estados globais.
- `src/pages/*Hub.tsx`: hubs de Mesa, Fichas, Geradores e Compêndio.
- `src/pages/Dashboard.tsx` e `src/pages/Index.tsx`: visão geral e atalhos.
- `src/lib/*`: persistência, regras e automações, sem mudança nesta fase.
