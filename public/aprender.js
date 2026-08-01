const SLOT_COLORS = ["var(--slot-1)", "var(--slot-2)", "var(--slot-3)", "var(--slot-4)", "var(--slot-5)"];

const ETAPAS = [
  {
    id: "introducao",
    titulo: "Introdução",
    dica: "Abra com um repertório que tenha gancho claro com o tema. Depois, escreva a tese: a problematização específica do tema + os dois argumentos que você vai desenvolver, na ordem em que vão aparecer nos parágrafos seguintes. Feche anunciando o eixo do combate/proposta, sem frases vagas como 'é preciso discutir'.",
    placeholder: "Escreva aqui o parágrafo de introdução...",
  },
  {
    id: "desenvolvimento1",
    titulo: "Desenvolvimento 1",
    dica: "Comece com o tópico frasal: conectivo + retomada da problematização + paráfrase do primeiro argumento da tese. Explique o mecanismo da causa, aplique um repertório de forma produtiva (explicado, não só citado) e traga um exemplo concreto.",
    placeholder: "Escreva aqui o primeiro parágrafo de desenvolvimento...",
  },
  {
    id: "desenvolvimento2",
    titulo: "Desenvolvimento 2",
    dica: "Abra com conectivo de continuidade (ex.: \"ademais\", \"além disso\") + retomada da problematização + paráfrase do segundo argumento. Se possível, amarre um termo ao D1. Traga repertório de apoio e exemplificação.",
    placeholder: "Escreva aqui o segundo parágrafo de desenvolvimento...",
  },
  {
    id: "conclusao",
    titulo: "Conclusão / Proposta de intervenção",
    dica: "Retome brevemente o problema. Monte a proposta de intervenção com os 5 elementos: agente, ação, meio/modo, efeito e detalhamento — articulada ao que você desenvolveu. Se possível, feche retomando o repertório ou a imagem da introdução.",
    placeholder: "Escreva aqui a conclusão, com a proposta de intervenção...",
  },
];

let indiceAtual = -1;
let activeId = ETAPAS[0].id;
const estados = {};
ETAPAS.forEach((e) => (estados[e.id] = { texto: "", enviado: false, coerente: null }));

const temaTitulo = document.getElementById("tema-titulo");
const textosMotivadores = document.getElementById("textos-motivadores");
const btnNovoTema = document.getElementById("btn-novo-tema");
const etapasContainer = document.getElementById("etapas");
const chatMensagens = document.getElementById("chat-mensagens");
const resultadoFinalEl = document.getElementById("resultado-final");
const bannerErro = document.getElementById("banner-erro");
const bannerErroTexto = document.getElementById("banner-erro-texto");

sortearTema();
mensagemBoasVindas();
renderEtapas();

btnNovoTema.addEventListener("click", () => {
  const teveProgresso = ETAPAS.some((e) => estados[e.id].texto.trim());
  if (teveProgresso && !confirm("Trocar de tema vai reiniciar o progresso desta redação. Continuar?")) return;
  sortearTema();
  resetarProgresso();
});

function sortearTema() {
  indiceAtual = indiceTemaAleatorio(indiceAtual);
  const escolhido = TEMAS[indiceAtual];
  temaTitulo.textContent = escolhido.tema;
  textosMotivadores.innerHTML = "";
  escolhido.textos.forEach((texto, i) => {
    const box = document.createElement("div");
    box.className = "texto-motivador";
    box.innerHTML = `<span class="fonte">Texto motivador ${romano(i + 1)}</span>${escapeHtml(texto)}`;
    textosMotivadores.appendChild(box);
  });
}

function resetarProgresso() {
  ETAPAS.forEach((e) => (estados[e.id] = { texto: "", enviado: false, coerente: null }));
  activeId = ETAPAS[0].id;
  chatMensagens.innerHTML = "";
  resultadoFinalEl.innerHTML = "";
  esconderErro();
  mensagemBoasVindas();
  renderEtapas();
}

function mensagemBoasVindas() {
  adicionarMensagemChat(
    "professora",
    "Oi! Eu sou a professora Jana. Vamos construir sua redação juntos, um parágrafo de cada vez. Leia o tema e os textos motivadores ao lado, escreva sua introdução logo abaixo e me envie — eu leio, digo se está coerente e como melhorar antes de você seguir para o desenvolvimento."
  );
}

function unlocked(index) {
  return index === 0 || estados[ETAPAS[index - 1].id].enviado;
}

function renderEtapas() {
  etapasContainer.innerHTML = "";

  ETAPAS.forEach((etapa, i) => {
    const estado = estados[etapa.id];
    const card = document.createElement("div");
    const ehAtiva = etapa.id === activeId;
    const ehDesbloqueada = unlocked(i);

    card.className = "etapa-card";
    if (!ehDesbloqueada) card.classList.add("bloqueada");
    else if (!ehAtiva && estado.enviado) card.classList.add("concluida");

    let statusHtml = "";
    if (estado.enviado) {
      const cls = estado.coerente === false ? "revisar" : "ok";
      const texto = estado.coerente === false ? "Revisar" : "Feedback recebido";
      statusHtml = `<div class="etapa-status ${cls}">${texto}</div>`;
    } else if (ehAtiva) {
      statusHtml = `<div class="etapa-status">Em andamento</div>`;
    }

    const header = `
      <div class="etapa-card-header">
        <div class="etapa-numero">${i + 1}</div>
        <div class="etapa-titulo">${escapeHtml(etapa.titulo)}</div>
        ${statusHtml}
      </div>
    `;

    if (!ehDesbloqueada) {
      card.innerHTML = `${header}<div class="etapa-dica">Complete a etapa anterior para desbloquear.</div>`;
    } else if (!ehAtiva) {
      card.innerHTML = `
        ${header}
        <div class="etapa-resumo">${escapeHtml(truncar(estado.texto, 240))}</div>
        <button type="button" class="etapa-editar" data-editar="${etapa.id}">Editar esta etapa</button>
      `;
    } else {
      const ehUltima = i === ETAPAS.length - 1;
      const textoBotaoAvancar = ehUltima ? "Corrigir redação completa" : "Avançar para a próxima etapa";
      card.innerHTML = `
        ${header}
        <div class="etapa-dica">${escapeHtml(etapa.dica)}</div>
        <textarea data-etapa="${etapa.id}" placeholder="${escapeHtml(etapa.placeholder)}">${escapeHtml(estado.texto)}</textarea>
        <div class="etapa-acoes">
          <button type="button" class="primary" data-enviar="${etapa.id}">Enviar para a professora</button>
          ${estado.enviado ? `<button type="button" class="secondary" data-avancar="${etapa.id}">${textoBotaoAvancar}</button>` : ""}
        </div>
      `;
    }

    etapasContainer.appendChild(card);
  });

  etapasContainer.querySelectorAll("[data-enviar]").forEach((btn) => {
    btn.addEventListener("click", () => enviarEtapa(btn.dataset.enviar));
  });
  etapasContainer.querySelectorAll("[data-avancar]").forEach((btn) => {
    btn.addEventListener("click", () => avancarOuConcluir(btn.dataset.avancar));
  });
  etapasContainer.querySelectorAll("[data-editar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeId = btn.dataset.editar;
      renderEtapas();
    });
  });
}

async function enviarEtapa(etapaId) {
  const etapa = ETAPAS.find((e) => e.id === etapaId);
  const idx = ETAPAS.indexOf(etapa);
  const textarea = etapasContainer.querySelector(`textarea[data-etapa="${etapaId}"]`);
  const texto = textarea.value.trim();

  if (!texto) {
    mostrarErro("Escreva o texto desta etapa antes de enviar.");
    return;
  }
  esconderErro();
  estados[etapaId].texto = texto;

  const btn = etapasContainer.querySelector(`[data-enviar="${etapaId}"]`);
  btn.disabled = true;
  btn.textContent = "Enviando...";

  adicionarMensagemChat("aluno", `Enviei a etapa "${etapa.titulo}".`);
  const carregando = adicionarMensagemCarregando("Lendo o que você escreveu...");

  const etapasAnteriores = ETAPAS.slice(0, idx)
    .filter((e) => estados[e.id].texto)
    .map((e) => ({ titulo: e.titulo, texto: estados[e.id].texto }));

  try {
    const resp = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tema: TEMAS[indiceAtual].tema,
        etapaLabel: etapa.titulo,
        dica: etapa.dica,
        texto,
        etapasAnteriores,
      }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.erro || "Erro desconhecido ao gerar feedback.");
    }

    removerMensagem(carregando);
    adicionarMensagemProfessora(data);

    estados[etapaId].enviado = true;
    estados[etapaId].coerente = data.coerente;
  } catch (err) {
    removerMensagem(carregando);
    mostrarErro(err.message);
  } finally {
    renderEtapas();
  }
}

function avancarOuConcluir(etapaId) {
  const idx = ETAPAS.findIndex((e) => e.id === etapaId);
  if (idx < ETAPAS.length - 1) {
    activeId = ETAPAS[idx + 1].id;
    renderEtapas();
  } else {
    corrigirRedacaoCompleta();
  }
}

async function corrigirRedacaoCompleta() {
  const tema = TEMAS[indiceAtual].tema;
  const texto = ETAPAS.map((e) => estados[e.id].texto).join("\n\n");

  esconderErro();
  resultadoFinalEl.innerHTML = "";
  const carregando = adicionarMensagemCarregando("Calculando a nota final da sua redação completa...");

  try {
    const resp = await fetch("/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema, texto, origem: "aprender" }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.erro || "Erro ao corrigir a redação completa.");
    }

    removerMensagem(carregando);
    adicionarMensagemChat("professora", `Sua redação completa tirou ${data.notaTotal}/1000! Veja o detalhamento abaixo.`);
    renderResultadoFinal(data);
    resultadoFinalEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    removerMensagem(carregando);
    mostrarErro(err.message);
  }
}

function adicionarMensagemChat(tipo, texto) {
  const div = document.createElement("div");
  div.className = `chat-msg ${tipo}`;
  chatMensagens.appendChild(div);

  if (tipo === "professora") {
    const tag = document.createElement("span");
    tag.className = "msg-tag";
    tag.textContent = "Professora Jana";
    div.appendChild(tag);

    const corpo = document.createElement("span");
    div.appendChild(corpo);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
    tipar(corpo, texto);
  } else {
    div.textContent = texto;
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
  }

  return div;
}

function adicionarMensagemProfessora(data) {
  const div = document.createElement("div");
  div.className = "chat-msg professora";
  chatMensagens.appendChild(div);

  const tag = document.createElement("span");
  tag.className = "msg-tag";
  tag.textContent = "Professora Jana";
  div.appendChild(tag);

  const corpo = document.createElement("span");
  div.appendChild(corpo);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;

  tipar(corpo, data.mensagem || "").then(() => {
    if (data.pontosFortes && data.pontosFortes.length) {
      const ul = document.createElement("ul");
      ul.innerHTML = data.pontosFortes.map((p) => `<li>✓ ${escapeHtml(p)}</li>`).join("");
      div.appendChild(ul);
    }
    if (data.pontosMelhorar && data.pontosMelhorar.length) {
      const ul = document.createElement("ul");
      ul.innerHTML = data.pontosMelhorar.map((p) => `<li>→ ${escapeHtml(p)}</li>`).join("");
      div.appendChild(ul);
    }
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
  });

  return div;
}

function adicionarMensagemCarregando(rotulo) {
  const div = document.createElement("div");
  div.className = "chat-msg professora carregando";
  div.innerHTML = `
    <span class="msg-tag">Professora Jana</span>
    <span class="carregando-texto">${escapeHtml(rotulo || "Lendo o que você escreveu...")}</span>
    <span class="dots-digitando"><span></span><span></span><span></span></span>
  `;
  chatMensagens.appendChild(div);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
  return div;
}

// Efeito de "digitando ao vivo": revela o texto caractere a caractere num
// elemento ja inserido no DOM, mantendo o chat rolado para o fim.
function tipar(el, texto) {
  return new Promise((resolve) => {
    const alvo = texto || "";
    const passoChars = alvo.length > 500 ? 4 : alvo.length > 220 ? 2 : 1;
    const cursor = document.createElement("span");
    cursor.className = "cursor-digitando";
    el.after(cursor);

    let i = 0;
    function passo() {
      i += passoChars;
      el.textContent = alvo.slice(0, i);
      chatMensagens.scrollTop = chatMensagens.scrollHeight;
      if (i < alvo.length) {
        setTimeout(passo, 14);
      } else {
        el.textContent = alvo;
        cursor.remove();
        resolve();
      }
    }
    passo();
  });
}

function removerMensagem(el) {
  if (el) el.remove();
}

function mostrarErro(msg) {
  bannerErroTexto.textContent = msg;
  bannerErro.classList.add("show");
}

function esconderErro() {
  bannerErro.classList.remove("show");
}

function truncar(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n).trim() + "…" : str;
}

function renderResultadoFinal(data) {
  const wrap = document.createElement("div");

  const notaTotal = document.createElement("div");
  notaTotal.className = "nota-total";
  notaTotal.innerHTML = `<span class="valor">${data.notaTotal ?? "—"}</span><span class="max">/ 1000${
    data.tema ? " · " + escapeHtml(data.tema) : ""
  }</span>`;
  wrap.appendChild(notaTotal);

  if (data.texto) {
    wrap.appendChild(renderRedacaoAnotada(data.texto, data.marcacoes));
  }

  const grid = document.createElement("div");
  grid.className = "grid-competencias";

  (data.competencias || []).forEach((c, i) => {
    const color = SLOT_COLORS[i % SLOT_COLORS.length];
    const card = document.createElement("div");
    card.className = "card-comp";
    card.style.setProperty("--accent", color);
    const pct = Math.max(0, Math.min(100, ((c.nota ?? 0) / 200) * 100));
    card.innerHTML = `
      <div class="comp-nome">Competência ${c.numero} — ${escapeHtml(c.nome || "")}</div>
      <div class="comp-nota">${c.nota ?? "—"} <span>/ 200</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="comp-toggle">Ver justificativa detalhada ▾</div>
      <div class="comp-detalhe">${escapeHtml(c.justificativa || "")}</div>
    `;
    card.addEventListener("click", () => {
      card.querySelector(".comp-detalhe").classList.toggle("show");
      const toggle = card.querySelector(".comp-toggle");
      toggle.textContent = card.querySelector(".comp-detalhe").classList.contains("show")
        ? "Ocultar justificativa ▴"
        : "Ver justificativa detalhada ▾";
    });
    grid.appendChild(card);
  });

  wrap.appendChild(grid);

  if (data.analiseParagrafos && data.analiseParagrafos.length) {
    const titulo = document.createElement("div");
    titulo.className = "secao-titulo";
    titulo.textContent = "Análise por parágrafo";
    wrap.appendChild(titulo);

    data.analiseParagrafos.forEach((p) => {
      const box = document.createElement("div");
      box.className = "paragrafo-analise";
      box.innerHTML = `<div class="parte">${escapeHtml(p.parte || "")}</div><p>${escapeHtml(p.comentario || "")}</p>`;
      wrap.appendChild(box);
    });
  }

  if (data.veredito) {
    const titulo = document.createElement("div");
    titulo.className = "secao-titulo";
    titulo.textContent = "Veredito";
    wrap.appendChild(titulo);

    const box = document.createElement("div");
    box.className = "veredito-box";
    box.textContent = data.veredito;
    wrap.appendChild(box);
  }

  resultadoFinalEl.appendChild(wrap);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
