/* ============================================================
   Aprendizado guiado (exercício de lacunas) — método Jana Rabelo.

   Portado do app de desktop (roteiro-enem-app/redacao.js): o aluno
   recebe um esqueleto de parágrafo com lacunas numeradas, preenche
   cada uma e recebe a análise da professora em cima das escolhas dele.
   Os prompts recebem o conteúdo da skill já montado pelo server.js.
   ============================================================ */

const PARTES_GUIADAS = {
  introducao: {
    titulo: "Introdução",
    espera: "repertório de abertura, gancho com o tema, tese com os dois argumentos (D1 e D2) e fechamento apontando para a intervenção",
  },
  desenvolvimento1: {
    titulo: "Desenvolvimento 1",
    espera: "tópico frasal com conectivo + retomada da problematização + paráfrase do primeiro argumento, explicação do mecanismo da causa, repertório produtivo e exemplo concreto",
  },
  desenvolvimento2: {
    titulo: "Desenvolvimento 2",
    espera: "conectivo de continuidade, paráfrase do segundo argumento, amarração lexical com o D1, repertório de apoio e exemplificação",
  },
  conclusao: {
    titulo: "Conclusão / Proposta de intervenção",
    espera: "retomada do problema e proposta de intervenção completa: agente, ação, meio/modo, efeito e detalhamento",
  },
};

function promptExercicio(skill, parteId, temaPedido) {
  const parte = PARTES_GUIADAS[parteId] || PARTES_GUIADAS.introducao;
  return `Voce e a professora Jana Rabelo preparando um exercicio guiado de redacao ENEM para um aluno. Use o metodo descrito na skill abaixo.

===== INICIO DO CONTEUDO DA SKILL =====
${skill}
===== FIM DO CONTEUDO DA SKILL =====

Monte um exercicio de COMPLETAR LACUNAS para a parte: "${parte.titulo}".
O que se espera dessa parte: ${parte.espera}.

${temaPedido && String(temaPedido).trim()
    ? `Use exatamente este tema: "${String(temaPedido).trim()}"`
    : "Escolha um tema atual e pertinente ao ENEM (problema social brasileiro contemporaneo), diferente dos temas mais batidos. Varie a area a cada exercicio."}

Voce deve entregar:
1. o tema;
2. um texto motivador curto (4 a 6 linhas) que contextualize o problema com dados ou fatos plausiveis;
3. duas causas ja definidas (D1 e D2), para o aluno nao precisar inventar o projeto de texto agora;
4. um MODELO da parte, escrito por voce, com lacunas numeradas onde o aluno vai colocar as ideias dele;
5. um guia curto de preenchimento, dizendo o que a banca espera em cada lacuna.

No modelo, marque cada lacuna com {{1}}, {{2}}, {{3}}... exatamente nesse formato, na ordem em que aparecem. Use de 4 a 6 lacunas. O texto fora das lacunas deve ser a estrutura pronta (conectivos e operadores argumentativos), de modo que, preenchido, o paragrafo fique coeso e no padrao da banca.

REGRA IMPORTANTE sobre o texto fixo do modelo: ele NAO pode pressupor que tipo de repertorio o aluno vai escolher. Nao escreva "Na obra {{1}}" nem "Segundo o filme {{1}}", porque o aluno pode citar uma lei, um dado ou um pensador e a frase fica incoerente. Ou ofereca as alternativas no proprio texto fixo ("Na obra / No documento / Segundo o pensador {{1}}"), ou deixe a moldura dentro da propria lacuna. O mesmo vale para retomadas posteriores: nao escreva "Paralelamente a ficcao" se o repertorio pode nao ser ficcional -- prefira retomadas neutras como "Paralelamente a esse ideal".

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem texto antes ou depois e sem blocos de codigo markdown:

{
  "tema": "string",
  "textoMotivador": "string",
  "d1": "string - a primeira causa, em uma frase",
  "d2": "string - a segunda causa, em uma frase",
  "parte": "${parte.titulo}",
  "modelo": "string com {{1}}, {{2}}... nas posicoes das lacunas",
  "lacunas": [
    {"n":1,"rotulo":"nome curto da lacuna, ex.: Repertorio de abertura","instrucao":"o que o aluno deve escrever aqui","exemplo":"um exemplo curto de preenchimento possivel"}
  ],
  "guia": ["dica curta e acionavel sobre o que a banca valoriza", "outra dica"]
}

Responda em portugues do Brasil.`;
}

function promptAnaliseGuiada(skill, ex, preenchido) {
  return `Voce e a professora Jana Rabelo analisando o exercicio guiado que o aluno acabou de preencher. Use o metodo da skill abaixo, com o rigor da banca.

===== INICIO DO CONTEUDO DA SKILL =====
${skill}
===== FIM DO CONTEUDO DA SKILL =====

Tema: ${ex.tema}
Parte trabalhada: ${ex.parte}
Causa 1 sugerida (D1): ${ex.d1}
Causa 2 sugerida (D2): ${ex.d2}

Modelo que o aluno recebeu (as lacunas eram dele):
"""
${ex.modelo}
"""

Texto final que o aluno produziu ao preencher as lacunas:
"""
${preenchido}
"""

Analise APENAS este paragrafo. Aponte desvios de norma culta citando o trecho exato e explicando a regra (crase, virgula apos conectivo, paralelismo, regencia). Avalie o repertorio (legitimo e pertinente? produtivo ou de bolso?), o gancho com o tema, e se a tese apresenta os dois argumentos com paralelismo sintatico. Depois reescreva o paragrafo corrigido, MANTENDO as ideias e o repertorio do aluno -- so ajustando a forma.

A analise sera exibida PARTE POR PARTE, acompanhando a leitura do paragrafo do inicio ao fim, como um professor lendo com a caneta na mao. Por isso, quebre o texto do aluno em trechos consecutivos.

REGRAS DA TRILHA:
- Os trechos devem ser copiados EXATAMENTE do texto do aluno, caractere por caractere, sem parafrasear e sem corrigir nada.
- Eles devem vir NA ORDEM em que aparecem e, juntos, cobrir o paragrafo inteiro, sem sobreposicao e sem pular pedaco.
- Quebre em 5 a 10 trechos, cada um numa unidade que faca sentido avaliar (uma oracao, o repertorio, o gancho, cada argumento da tese, o fechamento).
- "competencia" so recebe numero quando o trecho realmente mexe naquela competencia. Se o trecho esta correto e nao impacta nenhuma, use null: nao invente problema onde nao ha.

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem texto antes ou depois e sem blocos de codigo markdown:

{
  "trilha": [
    {"trecho":"copiado EXATAMENTE do texto do aluno","papel":"o que esse trecho deveria cumprir, ex.: repertorio de abertura, gancho com o tema, argumento 1","status":"ok ou atencao ou erro","competencia":numero de 1 a 5 ou null,"comentario":"o que ele faz de certo ou errado, em 1 ou 2 frases","correcao":"o trecho reescrito corrigido, vazio quando status for ok"}
  ],
  "repertorio": {
    "citado":"qual repertorio o aluno usou, nas palavras dele",
    "tipo":"lei, filosofia, literatura, historia, dados, cinema, outro",
    "legitimo":boolean,
    "produtivo":boolean,
    "analise":"analise profunda: o repertorio e pertinente ao recorte do tema? foi so citado (de bolso) ou explicado e articulado ao argumento (produtivo)? o aluno demonstra dominio real dele?",
    "impacto":"o que essa escolha faz com a nota da Competencia 2, concretamente",
    "comoMelhorar":"o que exatamente mudaria para esse repertorio virar produtivo de nota 200"
  },
  "portugues": [
    {"trecho":"o trecho exato com o desvio","tipo":"crase, virgula, regencia, concordancia, paralelismo, grafia, pontuacao, sintaxe ou outro","regra":"a regra em uma frase, explicada de forma que o aluno entenda o porque","corrigido":"o mesmo trecho ja corrigido","gravidade":"leve ou media ou grave"}
  ],
  "competencias": [
    {"numero":1,"nome":"Dominio da norma culta","diagnostico":"string em prosa","itens":["desvio especifico citando o trecho e a regra"]},
    {"numero":2,"nome":"Compreensao do tema e repertorio","diagnostico":"string","itens":["string"]},
    {"numero":3,"nome":"Projeto de texto e argumentacao","diagnostico":"string","itens":["string"]},
    {"numero":4,"nome":"Coesao textual","diagnostico":"string","itens":["string"]}
  ],
  "reescrita": "string - o paragrafo do aluno reescrito e corrigido, mantendo as ideias dele",
  "pontosAtencao": ["string curta - o que treinar nas proximas vezes"],
  "veredito": "string - 2 a 4 frases, em primeira pessoa, tom encorajador mas preciso",
  "pronto": boolean
}

Liste em "portugues" TODOS os desvios de norma culta que encontrar, um a um, mesmo os pequenos -- e nenhum que nao exista. "pronto" e true se o paragrafo ja cumpre o essencial da parte e o aluno pode avancar. Responda em portugues do Brasil.`;
}

/* Junta o modelo com o que o aluno escreveu em cada lacuna. */
function montarPreenchido(modelo, respostas) {
  return String(modelo).replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const v = respostas[Number(n)] != null ? respostas[Number(n)] : respostas[n];
    return v && String(v).trim() ? String(v).trim() : "[lacuna não preenchida]";
  });
}

function normalizarExercicio(bruto) {
  const modelo = String(bruto.modelo || "").trim();
  const numeros = (modelo.match(/\{\{(\d+)\}\}/g) || []).map((m) => Number(m.replace(/\D/g, "")));
  if (!modelo || !numeros.length) throw new Error("O exercicio veio sem lacunas utilizaveis. Tente gerar outro.");

  // só descreve lacunas que existem mesmo no modelo
  const lacunas = (bruto.lacunas || [])
    .map((l) => ({
      n: Number(l.n),
      rotulo: String(l.rotulo || "").trim(),
      instrucao: String(l.instrucao || "").trim(),
      exemplo: String(l.exemplo || "").trim(),
    }))
    .filter((l) => numeros.includes(l.n))
    .sort((a, b) => a.n - b.n);

  return {
    tema: String(bruto.tema || "").trim(),
    textoMotivador: String(bruto.textoMotivador || "").trim(),
    d1: String(bruto.d1 || "").trim(),
    d2: String(bruto.d2 || "").trim(),
    parte: String(bruto.parte || "Introdução").trim(),
    modelo,
    lacunas,
    guia: (bruto.guia || []).map((g) => String(g).trim()).filter(Boolean),
  };
}

/* A trilha só vale se os trechos existirem mesmo no texto e estiverem em
   ordem. Trecho inventado ou fora de ordem é descartado — e o que sobrar
   entre um trecho e outro vira um pedaço neutro, para não sumir texto. */
function normalizarTrilha(bruta, texto) {
  const itens = [];
  let cursor = 0;
  (bruta || []).forEach((t) => {
    const trecho = String(t.trecho || "");
    if (!trecho) return;
    const i = texto.indexOf(trecho, cursor);
    if (i === -1) return;
    if (i > cursor) {
      itens.push({ trecho: texto.slice(cursor, i), papel: "", status: "ok", competencia: null, comentario: "", correcao: "", costura: true });
    }
    itens.push({
      trecho,
      papel: String(t.papel || "").trim(),
      status: ["ok", "atencao", "erro"].includes(t.status) ? t.status : "ok",
      competencia: t.competencia == null ? null : Math.min(5, Math.max(1, Number(t.competencia) || 0)) || null,
      comentario: String(t.comentario || "").trim(),
      correcao: String(t.correcao || "").trim(),
    });
    cursor = i + trecho.length;
  });
  if (cursor < texto.length) {
    itens.push({ trecho: texto.slice(cursor), papel: "", status: "ok", competencia: null, comentario: "", correcao: "", costura: true });
  }
  return itens;
}

function normalizarAnaliseGuiada(bruto, texto) {
  const t = String(texto || "");
  return {
    trilha: normalizarTrilha(bruto.trilha, t),
    repertorio: bruto.repertorio ? {
      citado: String(bruto.repertorio.citado || "").trim(),
      tipo: String(bruto.repertorio.tipo || "").trim(),
      legitimo: bruto.repertorio.legitimo !== false,
      produtivo: !!bruto.repertorio.produtivo,
      analise: String(bruto.repertorio.analise || "").trim(),
      impacto: String(bruto.repertorio.impacto || "").trim(),
      comoMelhorar: String(bruto.repertorio.comoMelhorar || "").trim(),
    } : null,
    portugues: (bruto.portugues || [])
      .filter((p) => p && p.trecho && t.indexOf(String(p.trecho)) !== -1) // desvio precisa existir no texto
      .map((p) => ({
        trecho: String(p.trecho),
        tipo: String(p.tipo || "outro").trim(),
        regra: String(p.regra || "").trim(),
        corrigido: String(p.corrigido || "").trim(),
        gravidade: ["leve", "media", "grave"].includes(p.gravidade) ? p.gravidade : "media",
      })),
    competencias: (bruto.competencias || []).map((c) => ({
      numero: Number(c.numero) || 0,
      nome: String(c.nome || "").trim(),
      diagnostico: String(c.diagnostico || "").trim(),
      itens: (c.itens || []).map((i) => String(i).trim()).filter(Boolean),
    })),
    reescrita: String(bruto.reescrita || "").trim(),
    pontosAtencao: (bruto.pontosAtencao || []).map((p) => String(p).trim()).filter(Boolean),
    veredito: String(bruto.veredito || "").trim(),
    pronto: bruto.pronto !== false,
  };
}

/* ---------------------------------------------- avaliacao por criterios

   Exercicios curtos do app (tese, introducao com lacunas, paragrafos,
   proposta de intervencao). O aluno marca a propria autoavaliacao e a
   professora julga os mesmos criterios, um a um, com o rigor da banca.
   ------------------------------------------------------------------- */

function promptAvaliar(skill, { tema, tarefa, texto, criterios }) {
  const lista = criterios.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `Voce e a professora Jana Rabelo avaliando um exercicio curto de redacao ENEM feito por um aluno. Use o metodo da skill abaixo, com o rigor da banca.

===== INICIO DO CONTEUDO DA SKILL =====
${skill}
===== FIM DO CONTEUDO DA SKILL =====

Tema: ${tema || "nao informado"}
Exercicio pedido ao aluno: ${tarefa}

Texto do aluno:
"""
${texto}
"""

Julgue CADA criterio abaixo, na mesma ordem, como a banca julgaria. Marque "ok": true so quando o criterio esta claramente cumprido no texto; se estiver parcial ou duvidoso, marque false e diga o que falta. Em "comentario", cite o trecho do aluno entre aspas sempre que possivel e diga em uma ou duas frases por que cumpre ou nao.

Criterios:
${lista}

Depois, escreva uma "versaoMelhorada": o mesmo texto do aluno reescrito para cumprir todos os criterios, MANTENDO as ideias e o repertorio dele (so ajuste o necessario). E uma "mensagem" curta, em primeira pessoa, tom encorajador mas preciso.

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem texto antes ou depois e sem blocos de codigo markdown:

{
  "criterios": [ {"ok": boolean, "comentario": "string"} ],
  "mensagem": "string - 2 a 4 frases",
  "versaoMelhorada": "string"
}

O array "criterios" deve ter exatamente ${criterios.length} itens, na ordem dada. Responda em portugues do Brasil.`;
}

function normalizarAvaliacao(bruto, n) {
  const cs = Array.isArray(bruto.criterios) ? bruto.criterios : [];
  return {
    criterios: Array.from({ length: n }, (_, i) => ({
      ok: !!(cs[i] && cs[i].ok === true),
      comentario: String((cs[i] && cs[i].comentario) || "").trim(),
    })),
    mensagem: String(bruto.mensagem || "").trim(),
    versaoMelhorada: String(bruto.versaoMelhorada || "").trim(),
  };
}

/* ------------------------------------------- questoes de estrutura (IA)

   Questoes de multipla escolha sobre a estrutura da redacao, geradas a cada
   treino para o aluno nao decorar as mesmas. O app tem um banco fixo de
   reserva para quando estiver sem conexao.
   ------------------------------------------------------------------- */

function promptQuestoesEstrutura(skill, n, evitar) {
  return `Voce e a professora Jana Rabelo preparando um treino rapido sobre a ESTRUTURA da redacao dissertativo-argumentativa do ENEM. Use o metodo da skill abaixo e as regras oficiais da banca.

===== INICIO DO CONTEUDO DA SKILL =====
${skill}
===== FIM DO CONTEUDO DA SKILL =====

Crie ${n} questoes de multipla escolha, cada uma com exatamente 4 alternativas e UMA unica correta, sem ambiguidade. Varie os assuntos entre:
- funcao de cada paragrafo (introducao, desenvolvimentos, conclusao) e a ordem dos argumentos;
- tese e topico frasal (inclusive identificar a melhor tese ou o melhor topico frasal num trecho);
- proposta de intervencao (5 elementos: agente, acao, meio/modo, finalidade, detalhamento) e o que falta numa proposta dada;
- repertorio legitimo, pertinente e produtivo x repertorio de bolso;
- coesao (conectivos de abertura de cada paragrafo, retomadas);
- as 5 competencias e o que cada uma avalia;
- tangenciamento, fuga ao tema e situacoes que zeram a redacao.
Pelo menos metade das questoes deve trazer um "trecho" curto de redacao (1 a 3 frases) para o aluno analisar. Use temas variados de problemas sociais brasileiros. As alternativas erradas devem ser plausiveis (erros comuns de estudantes), nao absurdas.
${evitar && evitar.length ? `Nao repita estes enunciados ja usados: ${evitar.slice(0, 20).map((e) => `"${String(e).slice(0, 80)}"`).join("; ")}.` : ""}

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem texto antes ou depois e sem blocos de codigo markdown:

{
  "questoes": [
    {"enunciado":"string","trecho":"string ou vazio","alternativas":["a","b","c","d"],"correta":numero de 0 a 3,"explicacao":"2 a 3 frases explicando por que a correta e a certa e o erro das outras"}
  ]
}

Responda em portugues do Brasil.`;
}

function normalizarQuestoes(bruto) {
  return (bruto.questoes || [])
    .map((q) => ({
      enunciado: String(q.enunciado || "").trim(),
      trecho: String(q.trecho || "").trim(),
      alternativas: (q.alternativas || []).map((a) => String(a).trim()).filter(Boolean),
      correta: Number(q.correta),
      explicacao: String(q.explicacao || "").trim(),
    }))
    .filter((q) => q.enunciado && q.alternativas.length === 4 && q.correta >= 0 && q.correta <= 3 && q.explicacao);
}

function normalizarTutor(bruto) {
  return {
    mensagem: String(bruto.mensagem || "").trim(),
    pontosFortes: (bruto.pontosFortes || []).map((s) => String(s).trim()).filter(Boolean),
    pontosMelhorar: (bruto.pontosMelhorar || []).map((s) => String(s).trim()).filter(Boolean),
    coerente: bruto.coerente !== false,
  };
}

module.exports = {
  PARTES_GUIADAS,
  promptExercicio,
  promptAnaliseGuiada,
  montarPreenchido,
  normalizarExercicio,
  normalizarAnaliseGuiada,
  normalizarTutor,
  promptAvaliar,
  normalizarAvaliacao,
  promptQuestoesEstrutura,
  normalizarQuestoes,
};
