(function () {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar || !toggle || !backdrop) return;

  function abrirMenu() {
    sidebar.classList.add("aberta");
    backdrop.classList.add("show");
    toggle.setAttribute("aria-expanded", "true");
  }

  function fecharMenu() {
    sidebar.classList.remove("aberta");
    backdrop.classList.remove("show");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    if (sidebar.classList.contains("aberta")) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  });

  backdrop.addEventListener("click", fecharMenu);
  sidebar.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", fecharMenu));

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") fecharMenu();
  });
})();

(function () {
  const userLabel = document.getElementById("sidebar-user");
  const logoutBtn = document.getElementById("btn-logout");
  if (!userLabel && !logoutBtn) return;

  fetch("/api/session")
    .then((r) => r.json())
    .then((data) => {
      if (userLabel) userLabel.textContent = data.loggedIn ? data.username : "";
    })
    .catch(() => {});

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (_) {}
      window.location.href = "login.html";
    });
  }
})();
