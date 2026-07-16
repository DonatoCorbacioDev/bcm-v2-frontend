(function () {
  var s = localStorage.getItem("bcm-theme");
  var d = window.matchMedia("(prefers-color-scheme:dark)").matches;
  if (s === "dark" || (s === null && d)) {
    document.documentElement.classList.add("dark");
  }
})();
