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

/* Keeps the Leistungen dropdown's aria-expanded in sync with the CSS-only :hover/:focus-within
   reveal in styles.css (.nav-dropdown:hover .nav-dropdown-menu, ...:focus-within ...) — the menu
   itself needs no JS to open, but a static aria-expanded="false" would misreport its state to
   screen readers once a mouse or keyboard user actually reveals it. */
(function () {
  var dropdown = document.querySelector(".nav-dropdown");
  var trigger = dropdown && dropdown.querySelector(".nav-dropdown-trigger");
  if (!dropdown || !trigger) return;

  function setExpanded(expanded) {
    trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  dropdown.addEventListener("mouseenter", function () { setExpanded(true); });
  dropdown.addEventListener("mouseleave", function () { setExpanded(false); });
  dropdown.addEventListener("focusin", function () { setExpanded(true); });
  dropdown.addEventListener("focusout", function (e) {
    if (!dropdown.contains(e.relatedTarget)) setExpanded(false);
  });
})();
