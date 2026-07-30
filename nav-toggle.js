(function () {
  var nav = document.getElementById("site-nav");
  var toggle = nav && nav.querySelector(".nav-toggle");
  var collapsible = document.getElementById("nav-links-collapsible");
  if (!nav || !toggle || !collapsible) return;

  function close() {
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  collapsible.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", close);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) close();
  });
})();
