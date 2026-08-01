const HORA = new Date().getHours();
const EH_DIA = HORA >= 6 && HORA < 18;

document.getElementById("home-hero-bg").style.backgroundImage = `url("img/home-${EH_DIA ? "dia" : "noite"}.jpg")`;

let saudacao;
if (HORA >= 5 && HORA < 12) saudacao = "Bom dia,";
else if (HORA >= 12 && HORA < 18) saudacao = "Boa tarde,";
else saudacao = "Boa noite,";

document.getElementById("home-greeting-line1").textContent = saudacao;
document.getElementById("home-greeting-line2").textContent = "pronto(a) para evoluir sua redação hoje?";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const agora = new Date();
document.getElementById("home-date").textContent = `${agora.getDate()} de ${MESES[agora.getMonth()]}, ${agora.getFullYear()}`;

document.getElementById("btn-logout").addEventListener("click", async () => {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (_) {}
  window.location.href = "login.html";
});

carregarUltimaCorrecao();

async function carregarUltimaCorrecao() {
  const container = document.getElementById("home-ultima-correcao");
  try {
    const resp = await fetch("/api/historico");
    const historico = await resp.json();

    if (!historico.length) {
      container.className = "";
      container.innerHTML = `<div class="empty-state home-empty-hint">Você ainda não corrigiu nenhuma redação. Vá em "Corrigir" para começar.</div>`;
      return;
    }

    const ultima = historico[historico.length - 1];
    container.className = "ultima-correcao-float";
    container.innerHTML = `
      <a class="ultima-correcao-card" href="dashboard.html">
        <div class="ultima-correcao-info">
          <span class="label">Última correção</span>
          <div class="tema">${escapeHtml(ultima.tema || "Tema não identificado")}</div>
          <div class="data">${formatarData(ultima.data)}</div>
        </div>
        <div class="ultima-correcao-nota">${ultima.notaTotal ?? "—"}<span>/ 1000</span></div>
      </a>
    `;
  } catch (err) {
    container.className = "";
    container.innerHTML = `<div class="empty-state home-empty-hint">Não foi possível carregar sua última correção.</div>`;
  }
}

function formatarData(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (_) {
    return iso;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
