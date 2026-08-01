const form = document.getElementById("form-registro");
const btn = document.getElementById("btn-criar");
const bannerErro = document.getElementById("banner-erro");
const bannerErroTexto = document.getElementById("banner-erro-texto");

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  esconderErro();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const password2 = document.getElementById("password2").value;
  const codigo = document.getElementById("codigo").value.trim();

  if (password !== password2) {
    mostrarErro("As senhas nao coincidem.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Criando conta...";

  try {
    const resp = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, codigo }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.erro || "Erro ao criar conta.");
    }

    window.location.href = "home.html";
  } catch (err) {
    mostrarErro(err.message);
    btn.disabled = false;
    btn.textContent = "Criar conta";
  }
});

function mostrarErro(msg) {
  bannerErroTexto.textContent = msg;
  bannerErro.classList.add("show");
}

function esconderErro() {
  bannerErro.classList.remove("show");
}

document.querySelectorAll(".toggle-senha").forEach((botao) => {
  botao.addEventListener("click", () => {
    const pill = botao.closest(".input-pill");
    const input = pill.querySelector("input");
    const visivel = input.type === "text";
    input.type = visivel ? "password" : "text";
    pill.classList.toggle("senha-visivel", !visivel);
    botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
  });
});
