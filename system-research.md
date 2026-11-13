# Matriz pesquisada para fichas específicas do Arcanum

A pesquisa consolidada separou os sistemas por modelo de atributo, perícia, grau/proficiência, recurso e rolagem. A regra mais importante para implementação é não forçar um bônus universal: cada ficha deve manter seus componentes próprios e apenas expor um resultado normalizado para a interface.

## Perfis de rolagem

- **Ordem Paranormal 1e:** quantidade de d20 igual ao atributo, mantém o maior; atributo 0 usa 2d20 mantendo o menor; soma grau destreinado/treinado/veterano/expert (+0/+5/+10/+15) e modificadores.
- **Ordem Paranormal II Alpha:** soma um dado de atributo e um dado de perícia, normalmente d4–d12, contra dificuldade; Nível e NEX são campos separados.
- **D&D 5e:** d20 + modificador de atributo + proficiência quando aplicável; vantagem/desvantagem mantém maior/menor de 2d20.
- **Tormenta20:** d20 + metade do nível + atributo-chave + treinamento e modificadores contra CD.
- **Pathfinder 2e:** d20 + atributo + proficiência + modificadores; graus crítico/sucesso/falha/falha crítica, ±10 e 20/1 natural.
- **Call of Cthulhu 7e:** d100 contra valor regular, metade ou quinto; suporte a bônus/penalidade, opposed, Push e Luck.
- **Vampiro V5:** pool de d10 de atributo + perícia; 6+ é sucesso, dois 10 formam crítico, dados de Fome podem gerar Messy Critical/Bestial Failure.
- **Cyberpunk RED:** d10 + STAT + perícia contra DV; suporte a Luck, Death Save, armadura e ferimentos.
- **Mörk Borg:** d20 + modificador de atributo contra DR; corpo a corpo usa Força, à distância Presença e defesa Agilidade.
- **3D&T Alpha:** d6; FA corpo a corpo = F + H + d6, à distância = PdF + H + d6, FD = A + H + d6, iniciativa = H + d6.
- **Savage Worlds SWADE:** Trait die + modificadores; Wild Card também rola Wild Die; aces e Raises devem ser registrados.
- **Shadowrun 5e:** pool de d6 de atributo + perícia; 5/6 são hits; Limits, glitches, Edge e testes opostos são componentes separados.

## Modelo comum, sem apagar os dados atuais

A ficha deve ter `ruleset_id`, versão/edição, atributos com valor e dado, perícias com atributo ligado, grau/rating, proficiência, especialização e modificadores, recursos current/max, derivados com fórmula e override manual, ataques, inventário, habilidades, condições e histórico de rolagens. Fórmulas incertas ficam editáveis e marcadas como override; nunca são inferidas de outro sistema.

## Fontes principais

- Ordem: https://ordemparanormal.com.br/licenca ; https://movimentorpg.com.br/ordem-paranormal-rpg-guia-de-criacao-de-personagem/ ; https://caixinhaquantica.com/pericias-ordem-paranormal
- Ordem II: https://site.jamboeditora.com.br/arquivos-secretos/ ; https://erpg.app/pt/blog/ordem-paranormal-2-playtest-como-jogar/ ; https://erpg.app/pt/blog/ficha-automatica-ordem-paranormal-rpg-2/
- D&D: https://dnd.wizards.com/resources/systems-reference-document ; https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf ; https://www.dndbeyond.com/sources/basic-rules
- Tormenta20: https://jamboeditora.com.br/produto/tormenta20-bloco-de-fichas/ ; https://tormenta20.fandom.com/pt-br/wiki/Per%C3%ADcias
- Pathfinder 2e: https://2e.aonprd.com/Rules.aspx?ID=67 ; https://2e.aonprd.com/Rules.aspx?ID=171 ; https://2e.aonprd.com/Rules.aspx?ID=174 ; https://2e.aonprd.com/Rules.aspx?ID=319 ; https://2e.aonprd.com/Skills.aspx
- Cthulhu: https://www.chaosium.com/content/FreePDFs/CoC/CHA23131%20Call%20of%20Cthulhu%207th%20Edition%20Quick-Start%20Rules.pdf ; https://cthulhuwiki.chaosium.com/investigators/step-one-investigator-characteristics.html ; https://cthulhuwiki.chaosium.com/investigators/step-three-occupation-and-skills.html
- Vampiro: https://renegadegamestudios.com/vampire-the-masquerade-5th-edition-roleplaying-game-pdf-fillable-character-sheet/ ; https://vtm.paradoxwikis.com/Hunger_system
- Cyberpunk RED: https://rtalsoriangames.com/downloadable-content/ ; https://rtalsoriangames.com/wp-content/uploads/2020/11/RTG-CPR-CharacterSheet-Fillable.pdf
- Mörk Borg: https://morkborg.com/license/ ; https://help.alchemyrpg.com/en/articles/10234184-mork-borg
- 3D&T Alpha: https://jamboeditora.com.br/produto/manual-3det-alpha-edicao-revisada-digital/
- Savage Worlds: https://peginc.com/licensing/ ; https://shop.peginc.com/products/savage-worlds-character-sheets-pdf-swade
- Shadowrun: https://www.drivethrurpg.com/en/product/116662/shadowrun-fifth-edition-quick-start-rules ; https://github.com/chummer5a/chummer5a
