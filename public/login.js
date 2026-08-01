const form = document.getElementById("form-login");
const btn = document.getElementById("btn-entrar");
const bannerErro = document.getElementById("banner-erro");
const bannerErroTexto = document.getElementById("banner-erro-texto");

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  esconderErro();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  btn.disabled = true;
  btn.textContent = "Entrando...";

  try {
    const resp = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.erro || "Erro ao entrar.");
    }

    window.location.href = "index.html";
  } catch (err) {
    mostrarErro(err.message);
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});

function mostrarErro(msg) {
  bannerErroTexto.textContent = msg;
  bannerErro.classList.add("show");
}

function esconderErro() {
  bannerErro.classList.remove("show");
}
