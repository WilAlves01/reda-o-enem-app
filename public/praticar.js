const SLOT_COLORS = ["var(--slot-1)", "var(--slot-2)", "var(--slot-3)", "var(--slot-4)", "var(--slot-5)"];

let indiceAtual = -1;

const temaTitulo = document.getElementById("tema-titulo");
const textosMotivadores = document.getElementById("textos-motivadores");
const btnNovoTema = document.getElementById("btn-novo-tema");
const textoEl = document.getElementById("texto");
const btnCorrigir = document.getElementById("btn-corrigir");
const statusLine = document.getElementById("status-linha");
const resultadoEl = document.getElementById("resultado");
const bannerErro = document.getElementById("banner-erro");
const bannerErroTexto = document.getElementById("banner-erro-texto");

sortearTema();
btnNovoTema.addEventListener("click", sortearTema);
btnCorrigir.addEventListener("click", corrigirRedacao);

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

async function corrigirRedacao() {
  esconderErro();
  resultadoEl.innerHTML = "";

  const texto = textoEl.value.trim();
  if (!texto) {
    mostrarErro("Escreva sua redação antes de enviar para correção.");
    return;
  }

  const tema = TEMAS[indiceAtual].tema;

  btnCorrigir.disabled = true;
  btnCorrigir.textContent = "Corrigindo...";
  statusLine.textContent = "A IA está lendo e corrigindo o texto — isso pode levar até 1-2 minutos.";
  statusLine.classList.remove("error");

  try {
    const resp = await fetch("/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema, texto, origem: "praticar" }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.erro || "Erro desconhecido ao corrigir a redação.");
    }

    statusLine.textContent = "Correção concluída.";
    renderResultado(data);
  } catch (err) {
    statusLine.textContent = "";
    mostrarErro(err.message);
  } finally {
    btnCorrigir.disabled = false;
    btnCorrigir.textContent = "Corrigir esta redação";
  }
}

function mostrarErro(msg) {
  bannerErroTexto.textContent = msg;
  bannerErro.classList.add("show");
}

function esconderErro() {
  bannerErro.classList.remove("show");
}

function renderResultado(data) {
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

  resultadoEl.appendChild(wrap);
  resultadoEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
