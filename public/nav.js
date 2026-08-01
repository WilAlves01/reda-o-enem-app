(function () {
  const logoutBtn = document.getElementById("btn-logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (_) {}
    window.location.href = "login.html";
  });
})();
