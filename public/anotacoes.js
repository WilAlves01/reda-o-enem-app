const NOMES_COMPETENCIA = {
  1: "C1 · Domínio da norma culta",
  2: "C2 · Compreensão do tema e repertório",
  3: "C3 · Projeto de texto e argumentação",
  4: "C4 · Coesão textual",
  5: "C5 · Proposta de intervenção",
};

// Recebe o texto original da redacao e a lista de marcacoes vindas do modelo
// ({trecho, competencia, tipo, comentario}) e devolve um elemento pronto para
// ser inserido no DOM, com o texto grifado por competencia/erro e tooltips.
function renderRedacaoAnotada(texto, marcacoes) {
  const wrap = document.createElement("div");
  wrap.className = "redacao-anotada-wrap";

  const localizadas = localizarMarcacoes(texto || "", marcacoes || []);

  if (localizadas.length) {
    const legenda = document.createElement("div");
    legenda.className = "legenda-marcacoes";
    legenda.innerHTML = `
      <span class="legenda-item"><span class="legenda-dot comp-1"></span>C1</span>
      <span class="legenda-item"><span class="legenda-dot comp-2"></span>C2</span>
      <span class="legenda-item"><span class="legenda-dot comp-3"></span>C3</span>
      <span class="legenda-item"><span class="legenda-dot comp-4"></span>C4</span>
      <span class="legenda-item"><span class="legenda-dot comp-5"></span>C5</span>
      <span class="legenda-item"><span class="legenda-dot erro"></span>Ponto de atenção</span>
    `;
    wrap.appendChild(legenda);
  }

  const box = document.createElement("div");
  box.className = "redacao-anotada";
  box.innerHTML = montarHtmlAnotado(texto || "", localizadas);
  wrap.appendChild(box);

  return wrap;
}

function localizarMarcacoes(texto, marcacoes) {
  const encontradas = [];

  marcacoes.forEach((m) => {
    if (!m || !m.trecho) return;
    const idx = texto.indexOf(m.trecho);
    if (idx === -1) return;
    encontradas.push({
      start: idx,
      end: idx + m.trecho.length,
      competencia: m.competencia,
      tipo: m.tipo === "erro" ? "erro" : "acerto",
      comentario: m.comentario || "",
    });
  });

  encontradas.sort((a, b) => a.start - b.start);

  const semSobreposicao = [];
  let ultimoFim = -1;
  encontradas.forEach((m) => {
    if (m.start >= ultimoFim) {
      semSobreposicao.push(m);
      ultimoFim = m.end;
    }
  });

  return semSobreposicao;
}

function montarHtmlAnotado(texto, marcacoes) {
  let html = "";
  let cursor = 0;

  marcacoes.forEach((m) => {
    html += escapeHtmlAnotacao(texto.slice(cursor, m.start));

    const rotuloComp = NOMES_COMPETENCIA[m.competencia] || `Competência ${m.competencia}`;
    const classe = m.tipo === "erro" ? "marca tipo-erro" : `marca tipo-acerto comp-${m.competencia}`;
    const tituloTooltip = m.tipo === "erro" ? "Ponto de atenção" : "Ponto forte";
    const tooltip = `${tituloTooltip} — ${rotuloComp}${m.comentario ? ": " + m.comentario : ""}`;

    html += `<mark class="${classe}" tabindex="0" data-tooltip="${escapeAttrAnotacao(tooltip)}">${escapeHtmlAnotacao(
      texto.slice(m.start, m.end)
    )}</mark>`;

    cursor = m.end;
  });

  html += escapeHtmlAnotacao(texto.slice(cursor));
  return html;
}

function escapeHtmlAnotacao(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttrAnotacao(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
