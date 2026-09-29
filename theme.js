(function () {
  const KEY = "games-theme";
  const LEGACY = "ttt-theme";

  function getPreferred() {
    const saved = localStorage.getItem(KEY) || localStorage.getItem(LEGACY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
  }

  function toggle() {
    apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }

  apply(getPreferred());

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggle);
  });
})();
