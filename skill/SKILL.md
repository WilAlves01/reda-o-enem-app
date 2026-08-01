---
name: correcao-redacao-enem-jana-rabelo
description: Use this skill whenever the user asks to correct, grade, give a nota, or give feedback on a dissertative-argumentative essay written in the ENEM (Brazilian exam) style — "redação nos moldes do ENEM" — OR asks for help planning, writing, or improving one. Covers two modes: (1) diagnostic correction — assigning a 0-1000 grade broken down by the five official competências, with paragraph-by-paragraph justification; (2) writing coaching — planning a text from a theme/proposta, building tese/tópico frasal, choosing repertório, and flagging the points graders scrutinize most. Based on the official ENEM Matriz de Referência (Cartilha do Participante 2025) combined with the correction method and vocabulary of professora Jana Rabelo. Trigger on requests like "corrija minha redação", "dê nota nessa redação", "avalie esse texto do ENEM", "como faço uma redação nota 1000", "me ajude a escrever uma redação", "quais competências preciso melhorar", "revise minha redação", "monte um esqueleto pra esse tema".
---

# Correção e escrita de redação ENEM — método Jana Rabelo

Esta skill tem duas funções e a instrução certa depende do que o usuário pediu — decida o modo antes de agir.

**Modo CORREÇÃO** — o usuário mandou um texto pronto (dele ou de terceiros) e quer nota/feedback. Vá para "Modo Correção" abaixo.

**Modo ESCRITA/PLANEJAMENTO** — o usuário quer ajuda para escrever, tem só um tema/proposta, ou pergunta o que precisa ter atenção antes de escrever. Vá para "Modo Escrita" abaixo.

Se o pedido for ambíguo, pergunte rapidamente qual dos dois modos o usuário quer, ou se quer os dois (planejar e, depois de escrito, corrigir).

Antes de qualquer correção ou orientação, leia os arquivos em `references/` relevantes — eles contêm o detalhamento que não cabe aqui:

- `references/matriz-referencia.md` — os seis níveis de pontuação oficiais (0/40/80/120/160/200) para cada uma das cinco competências, direto da Cartilha do Participante do ENEM 2025. Consulte sempre antes de atribuir uma nota.
- `references/vocabulario-metodo-jana.md` — o glossário de diagnóstico da Jana (lacuna argumentativa, repertório de bolso vs. produtivo, tangenciamento interno, generalização excessiva, "efeito resumo de filme", "problema do E daí", "modo naja", técnica do sanduíche, fórmula do tópico frasal, etc.) com definição e exemplo real de cada termo.
- `references/casos-calibracao.md` — seis redações reais já analisadas (notas 760, 920/980, 960 x2, 1000 "limite" e 1000 "redondo"), servindo de âncora para calibrar o quão rigoroso ser em cada faixa de nota.
- `references/metodo-planejamento-escrita.md` — o método de planejamento em 1 hora (esqueleto de 4 parágrafos, grifagem do tema, repertórios coringa por eixo).

## Modo Correção

Siga esta sequência — é a mesma lógica que a Jana aplica em toda análise que ela faz:

**1. Leia o texto inteiro antes de anotar qualquer coisa.** Identifique tema, tese e quantos parágrafos de desenvolvimento existem.

**2. Analise parágrafo por parágrafo**, na ordem: introdução → D1 → D2 (→ D3 se houver) → conclusão/proposta de intervenção. Para cada parágrafo, cheque:

- *Competência 1 (norma culta)* — desvios de ortografia, acentuação, hífen, regência, concordância, crase, pontuação, paralelismo, escolha de registro (marcas de oralidade) e escolha vocabular (palavra errada ou vaga, tipo "algo"). Separe erro real de traço regional/estilístico que "é feio mas não pontua contra". Ver `vocabulario-metodo-jana.md` para os tipos de erro que a Jana mais frequentemente cataloga.
- *Competência 2 (tema + repertório)* — o parágrafo está dentro do recorte exato do tema, ou apenas tangencia um assunto próximo (tangenciamento pode ser do texto inteiro OU interno a um único parágrafo — veja "tangenciamento interno" no glossário)? Todo repertório citado: é pertinente (tem gancho real com o tema, idealmente usando uma palavra do próprio comando) e é produtivo (o aluno faz algo com ele — contrasta, explica, aprofunda — em vez de só citar e seguir em frente)? Repertório citado e nunca mais retomado é falha.
- *Competência 3 (projeto de texto / argumentação)* — aplique a fórmula do tópico frasal: conectivo interparágrafo + retomada da problematização geral + paráfrase (não repetição literal) do argumento prometido na tese. Cheque se cada D retoma exatamente o argumento que a tese prometeu para aquele parágrafo, na mesma ordem. Toda afirmação foi explicada e exemplificada, ou ficou uma lacuna argumentativa (algo afirmado sem sustentação — o "problema do E daí")? Há generalização excessiva (afirmações categóricas sem ressalva)?
- *Competência 4 (coesão)* — cada parágrafo abre com conectivo interparágrafo (a ausência disso na abertura de um D é falha comum)? Há amarração lexical entre parágrafos (retomada/paráfrase de termo-chave, não só conectivo solto)? O conector usado estabelece a relação lógica correta (causa, contraste, adição, conclusão) ou está ali só de enfeite?
- *Competência 5 (proposta de intervenção, só na conclusão)* — conte literalmente os 5 elementos: agente, ação, meio/modo, efeito/finalidade, detalhamento. Marque quais estão presentes e quais faltam — isso mapeia direto para a nota (5/5 bem articulados tende a 200; faltar meio/modo e/ou detalhamento tende a travar em 120-160; ver `matriz-referencia.md`). Cheque se a proposta é articulada ao que foi de fato argumentado no desenvolvimento (proposta que não corresponde ao argumento é falha, mesmo com os 5 elementos presentes) e se não fere direitos humanos.

**3. Atribua uma nota por competência (0/40/80/120/160/200)**, cada uma com uma frase de justificativa objetiva citando o trecho ou o problema específico — nunca dê nota sem apontar exatamente o que a sustenta, seguindo os descritores de `matriz-referencia.md`.

**4. Feche com um "modo naja" opcional quando fizer sentido**: se o usuário mencionou uma nota oficial (por exemplo, "essa redação tirou 980 no ENEM"), ofereça também a leitura rigorosa própria — seu diagnóstico competência a competência pode divergir da nota oficial, e isso deve ser explicado, não só declarado. Se não há nota oficial de referência, o "modo naja" é simplesmente sua nota mais rigorosa vs. uma leitura mais generosa, deixando claro os pontos de divergência.

**5. Termine com um veredito curto**: nota total estimada (soma das 5 competências), e 2-3 frases sobre o que mais custou pontos e o que precisa de mais atenção para subir de faixa.

Escreva a correção em prosa organizada por competência ou por parágrafo (o que for mais claro para o texto em questão) — não precisa reproduzir tabelas se um parágrafo corrido comunica melhor. Use o vocabulário técnico do glossário sempre que o fenômeno correspondente aparecer no texto — isso torna o feedback mais preciso e ensina o vocabulário certo ao usuário.

## Modo Escrita

Quando o usuário fornece um tema/proposta (ou pede para "montar um esqueleto"), siga `metodo-planejamento-escrita.md`:

1. Ajude a decompor o comando do tema: qual é a situação-problema, qual o eixo temático, e quais são as palavras-comando implícitas (ex.: "desafios" pede causas; "combater"/"enfrentar" pede foco em propostas de intervenção).
2. Ajude a levantar 2 argumentos/causas centrais e repertórios pertinentes para cada um — lembrando que repertório "coringa" (preparado com antecedência por eixo temático) só funciona se for aplicado de forma explicada e conectada ao tema específico; nunca cole um repertório genérico sem esse trabalho de conexão (isso é exatamente o "repertório de bolso" que a banca penaliza).
3. Monte o esqueleto de 4 parágrafos:
   - Introdução: repertório de abertura com gancho claro para o tema → tese com problematização + os dois argumentos que serão desenvolvidos (na ordem em que aparecerão) → fechamento anunciando o eixo do combate/proposta.
   - D1: tópico frasal (conectivo + retomada da problematização + paráfrase do argumento 1) → aprofundamento explicando o mecanismo → repertório aplicado de forma produtiva → exemplificação concreta.
   - D2: mesma estrutura para o argumento 2, com conectivo de continuidade/adição e, se possível, uma amarração lexical de volta ao D1.
   - Conclusão/proposta: proposta(s) de intervenção contendo os 5 elementos (agente, ação, meio/modo, efeito, detalhamento), articulada aos argumentos desenvolvidos — uma proposta dupla (uma por causa) é reforço seguro para C3 e C5.
4. Se o usuário estiver planejando sob tempo, lembre o método de 1 hora: 10-15 min de planejamento, 25-30 min de rascunho corrido sem parar para revisar, 20-30 min de pausa (fazer outras questões) antes de passar a limpo já revisando.
5. Depois de qualquer rascunho que o usuário escrever a partir desse planejamento, ofereça revisar no Modo Correção acima, apontando especificamente os pontos que mais pesam nas competências (lacunas argumentativas, repertório não retomado, ausência de conectivo de abertura de parágrafo, elementos faltantes na proposta) — esse é o "foco nos pontos que precisam de atenção" que costuma fazer a diferença entre notas médias e notas altas.

## Princípios gerais (aplicam-se aos dois modos)

- Precisão sobre generosidade: aponte o problema exato, com o trecho citado, em vez de comentários genéricos como "pode melhorar a coesão".
- Nunca minta sobre nota — se um texto é mediano, diga isso e explique por quê, com o mesmo cuidado didático da Jana, não com aspereza.
- Repertório de bolso é o erro mais comum e mais mal compreendido pelos alunos — sempre que identificar um repertório citado sem desenvolvimento, nomeie explicitamente esse padrão e explique como se tornaria produtivo (repare que a solução costuma ser: explicar o conceito, contextualizar a fonte, e amarrar de volta ao argumento específico do parágrafo).
- Direitos humanos: qualquer proposta de intervenção que incite violência, pena de morte/tortura, "justiça com as próprias mãos" ou discurso de ódio deve ser marcada como zerando a Competência 5, independentemente da qualidade do resto do texto.
