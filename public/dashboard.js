const SLOT_COLORS = ["var(--slot-1)", "var(--slot-2)", "var(--slot-3)", "var(--slot-4)", "var(--slot-5)"];
const conteudo = document.getElementById("conteudo");
const detalheCache = {};

carregar();

async function carregar() {
  try {
    const resp = await fetch("/api/historico");
    const historico = await resp.json();
    render(historico);
  } catch (err) {
    conteudo.innerHTML = `<div class="empty-state">Não foi possível carregar o histórico: ${escapeHtml(err.message)}</div>`;
  }
}

function render(historico) {
  conteudo.innerHTML = "";

  if (!historico.length) {
    conteudo.innerHTML = `<div class="empty-state">Nenhuma redação corrigida ainda. Vá em "Corrigir" para começar.</div>`;
    return;
  }

  const total = historico.length;
  const media = Math.round(historico.reduce((s, r) => s + (r.notaTotal || 0), 0) / total);
  const melhor = historico.reduce((a, b) => ((b.notaTotal || 0) > (a.notaTotal || 0) ? b : a));

  const stats = document.createElement("div");
  stats.className = "stat-row";
  stats.innerHTML = `
    <div class="stat-tile"><div class="label">Redações corrigidas</div><div class="value">${total}</div></div>
    <div class="stat-tile"><div class="label">Média geral</div><div class="value">${media}</div></div>
    <div class="stat-tile"><div class="label">Melhor nota</div><div class="value">${melhor.notaTotal ?? "—"}</div></div>
  `;
  conteudo.appendChild(stats);

  const chartBox = document.createElement("div");
  chartBox.className = "chart-box";
  chartBox.style.position = "relative";
  chartBox.innerHTML = `<h2>Evolução da nota total</h2><p class="chart-sub">Cada ponto é uma redação corrigida, em ordem cronológica.</p>`;
  const chartHost = document.createElement("div");
  chartBox.appendChild(chartHost);
  conteudo.appendChild(chartBox);
  renderChart(chartHost, chartBox, historico);

  const tituloTabela = document.createElement("div");
  tituloTabela.className = "secao-titulo";
  tituloTabela.textContent = "Histórico completo";
  conteudo.appendChild(tituloTabela);

  const table = document.createElement("table");
  table.className = "historico";
  table.innerHTML = `
    <thead>
      <tr><th>Data</th><th>Origem</th><th>Tema</th><th>Nota</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  historico
    .slice()
    .reverse()
    .forEach((r) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      const comps = r.competencias || [];
      const compCell = (n) => {
        const c = comps.find((x) => x.numero === n);
        return c ? c.nota : "—";
      };
      tr.innerHTML = `
        <td>${formatarData(r.data)}</td>
        <td>${origemBadge(r.origem)}</td>
        <td>${escapeHtml(r.tema || "—")}</td>
        <td><span class="pill">${r.notaTotal ?? "—"}</span></td>
        <td>${compCell(1)}</td>
        <td>${compCell(2)}</td>
        <td>${compCell(3)}</td>
        <td>${compCell(4)}</td>
        <td>${compCell(5)}</td>
      `;
      tr.addEventListener("click", () => toggleDetalhe(tr, r.id));
      tbody.appendChild(tr);
    });

  const scrollWrap = document.createElement("div");
  scrollWrap.className = "table-scroll";
  scrollWrap.appendChild(table);
  conteudo.appendChild(scrollWrap);
}

async function toggleDetalhe(tr, id) {
  const existente = tr.nextElementSibling;
  if (existente && existente.classList.contains("linha-detalhe")) {
    existente.remove();
    return;
  }

  // fecha outros detalhes abertos
  document.querySelectorAll(".linha-detalhe").forEach((el) => el.remove());

  const linha = document.createElement("tr");
  linha.className = "linha-detalhe";
  const td = document.createElement("td");
  td.colSpan = 9;
  td.innerHTML = `<div class="empty-state" style="padding:16px 0;">Carregando detalhes...</div>`;
  linha.appendChild(td);
  tr.after(linha);

  try {
    if (!detalheCache[id]) {
      const resp = await fetch(`/api/historico/${id}`);
      detalheCache[id] = await resp.json();
    }
    const r = detalheCache[id];

    const detalheWrap = document.createElement("div");
    detalheWrap.style.padding = "10px 4px 18px";

    (r.competencias || []).forEach((c, i) => {
      const box = document.createElement("div");
      box.style.marginBottom = "10px";
      box.style.paddingLeft = "10px";
      box.style.borderLeft = `3px solid ${SLOT_COLORS[i % SLOT_COLORS.length]}`;
      box.innerHTML = `<strong>C${c.numero} — ${escapeHtml(c.nome || "")}: ${c.nota}/200</strong><div style="font-size:13px;color:var(--text-secondary);margin-top:3px;">${escapeHtml(
        c.justificativa || ""
      )}</div>`;
      detalheWrap.appendChild(box);
    });

    if (r.veredito) {
      const v = document.createElement("div");
      v.className = "veredito-box";
      v.style.marginTop = "12px";
      v.textContent = r.veredito;
      detalheWrap.appendChild(v);
    }

    td.innerHTML = "";
    td.appendChild(detalheWrap);
  } catch (err) {
    td.innerHTML = `<div class="empty-state">Erro ao carregar detalhes: ${escapeHtml(err.message)}</div>`;
  }
}

function renderChart(host, chartBox, historico) {
  const width = 900;
  const height = 260;
  const padL = 46;
  const padR = 24;
  const padT = 16;
  const padB = 34;

  const points = historico;
  const n = points.length;
  const xStep = n > 1 ? (width - padL - padR) / (n - 1) : 0;
  const x = (i) => padL + i * xStep;
  const y = (v) => padT + (1 - Math.max(0, Math.min(1000, v || 0)) / 1000) * (height - padT - padB);

  const CHART_LINE = "#7dd3fc";
  const CHART_GRID = "rgba(255, 255, 255, 0.09)";
  const CHART_MUTED = "rgba(234, 241, 251, 0.55)";
  const CHART_CROSSHAIR = "rgba(255, 255, 255, 0.35)";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.style.display = "block";
  svg.style.overflow = "visible";

  const defs = document.createElementNS(svgNS, "defs");
  defs.innerHTML = `
    <filter id="chart-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CHART_LINE}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${CHART_LINE}" stop-opacity="0" />
    </linearGradient>
  `;
  svg.appendChild(defs);

  // gridlines + labels
  [0, 200, 400, 600, 800, 1000].forEach((v) => {
    const gy = y(v);
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", padL);
    line.setAttribute("x2", width - padR);
    line.setAttribute("y1", gy);
    line.setAttribute("y2", gy);
    line.setAttribute("stroke", CHART_GRID);
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", padL - 10);
    label.setAttribute("y", gy + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", CHART_MUTED);
    label.textContent = v;
    svg.appendChild(label);
  });

  // area sob a linha
  if (n) {
    const areaD =
      points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.notaTotal)}`).join(" ") +
      ` L${x(n - 1)},${height - padB} L${x(0)},${height - padB} Z`;
    const area = document.createElementNS(svgNS, "path");
    area.setAttribute("d", areaD);
    area.setAttribute("fill", "url(#chart-area)");
    area.setAttribute("stroke", "none");
    svg.appendChild(area);
  }

  // linha (com brilho)
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.notaTotal)}`).join(" ");
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", CHART_LINE);
  path.setAttribute("stroke-width", "2.5");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("filter", "url(#chart-glow)");
  svg.appendChild(path);

  // marcadores
  points.forEach((p, i) => {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", x(i));
    c.setAttribute("cy", y(p.notaTotal));
    c.setAttribute("r", "4");
    c.setAttribute("fill", CHART_LINE);
    c.setAttribute("stroke", "#0a1626");
    c.setAttribute("stroke-width", "2");
    svg.appendChild(c);
  });

  // rotulo direto no ultimo ponto
  if (n) {
    const last = points[n - 1];
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x(n - 1) + 8);
    label.setAttribute("y", y(last.notaTotal) - 8);
    label.setAttribute("font-size", "12");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", "#ffffff");
    label.textContent = last.notaTotal;
    svg.appendChild(label);
  }

  // crosshair (escondido por padrao)
  const crosshair = document.createElementNS(svgNS, "line");
  crosshair.setAttribute("y1", padT);
  crosshair.setAttribute("y2", height - padB);
  crosshair.setAttribute("stroke", CHART_CROSSHAIR);
  crosshair.setAttribute("stroke-width", "1");
  crosshair.setAttribute("stroke-dasharray", "3,3");
  crosshair.style.opacity = "0";
  svg.appendChild(crosshair);

  host.appendChild(svg);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-chart";
  chartBox.appendChild(tooltip);

  const overlay = document.createElementNS(svgNS, "rect");
  overlay.setAttribute("x", padL);
  overlay.setAttribute("y", padT);
  overlay.setAttribute("width", Math.max(0, width - padL - padR));
  overlay.setAttribute("height", Math.max(0, height - padT - padB));
  overlay.setAttribute("fill", "transparent");
  svg.appendChild(overlay);

  overlay.addEventListener("mousemove", (ev) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const mouseX = (ev.clientX - rect.left) * scaleX;
    let i = n > 1 ? Math.round((mouseX - padL) / xStep) : 0;
    i = Math.max(0, Math.min(n - 1, i));
    const p = points[i];

    crosshair.setAttribute("x1", x(i));
    crosshair.setAttribute("x2", x(i));
    crosshair.style.opacity = "1";

    const scaleXBox = rect.width / width;
    tooltip.style.left = `${x(i) * scaleXBox}px`;
    tooltip.style.top = `${y(p.notaTotal) * (rect.height / height)}px`;
    tooltip.innerHTML = `<strong>${p.notaTotal}/1000</strong><br/>${escapeHtml(p.tema || "Tema não identificado")}<br/>${formatarData(
      p.data
    )}`;
    tooltip.classList.add("show");
  });

  overlay.addEventListener("mouseleave", () => {
    crosshair.style.opacity = "0";
    tooltip.classList.remove("show");
  });
}

function formatarData(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (_) {
    return iso;
  }
}

const ORIGEM_LABELS = {
  corrigir: "Corrigir",
  praticar: "Praticar",
  aprender: "Aprender",
};

function origemBadge(origem) {
  const chave = ORIGEM_LABELS[origem] ? origem : "corrigir";
  return `<span class="origem-badge ${chave}">${ORIGEM_LABELS[chave]}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
