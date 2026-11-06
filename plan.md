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
