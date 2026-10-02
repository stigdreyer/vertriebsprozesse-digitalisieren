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

/* Touch devices with the desktop nav layout (tablets above 720px) have no hover, so a tap on the
   "Leistungen" link would jump straight to /#leistungen and the submenu could never be opened.
   First tap opens the submenu, second tap follows the link. "Was it already open?" is read on
   pointerdown, before the tap's own focus/hover reveals the menu, so iOS's built-in
   "first tap = hover" behaviour doesn't turn this into a three-tap link. Mouse, keyboard and the
   mobile menu (submenu always expanded below 720px) keep their normal one-click behaviour. */
(function () {
  var dropdown = document.querySelector(".nav-dropdown");
  var trigger = dropdown && dropdown.querySelector(".nav-dropdown-trigger");
  var menu = dropdown && dropdown.querySelector(".nav-dropdown-menu");
  if (!dropdown || !trigger || !menu) return;

  var touchTap = false;
  var wasVisible = false;

  function close() {
    dropdown.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("pointerdown", function (e) {
    touchTap = e.pointerType === "touch" || e.pointerType === "pen";
    wasVisible = getComputedStyle(menu).visibility === "visible";
  });

  trigger.addEventListener("click", function (e) {
    if (!touchTap || window.innerWidth <= 720 || wasVisible) return;
    e.preventDefault();
    dropdown.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  });

  document.addEventListener("pointerdown", function (e) {
    if (dropdown.classList.contains("is-open") && !dropdown.contains(e.target)) {
      close();
      trigger.blur();
    }
  });
})();
