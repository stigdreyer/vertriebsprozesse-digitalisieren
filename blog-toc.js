/* Highlights the currently-read section in the blog post's table of contents.
   Progressive enhancement: without JS the TOC still renders and every link still works,
   it just never gains the .is-active marker.

   Uses scroll position rather than IntersectionObserver on purpose — IO answers "is this heading
   visible", but the question here is "which section am I inside", which stays true long after the
   heading itself has scrolled off the top. */
(function () {
  var toc = document.querySelector(".blog-toc #TableOfContents");
  if (!toc) return;

  var entries = [];
  var links = toc.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < links.length; i++) {
    var raw = links[i].getAttribute("href").slice(1);
    var id = raw;
    // Hugo percent-encodes non-ASCII heading anchors (German umlauts), but getElementById needs
    // the decoded form. Malformed sequences would throw, so fall back to the raw value.
    try { id = decodeURIComponent(raw); } catch (e) { id = raw; }
    var heading = document.getElementById(id) || document.getElementById(raw);
    if (heading) entries.push({ link: links[i], heading: heading });
  }
  if (!entries.length) return;

  var current = null;
  function setActive(link) {
    if (link === current) return;
    if (current) current.classList.remove("is-active");
    if (link) link.classList.add("is-active");
    current = link;
  }

  function update() {
    // Activation line sits just below the sticky site nav, so a heading counts as "current"
    // once it reaches the top of the readable area rather than when it first appears.
    var line = 140;
    var active = null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].heading.getBoundingClientRect().top <= line) active = entries[i].link;
      else break;
    }
    // Before the first heading is reached nothing is highlighted; at the very bottom of the page
    // the last section stays highlighted even if its heading is far above the line.
    if (!active && window.scrollY + window.innerHeight >= document.body.scrollHeight - 2) {
      active = entries[entries.length - 1].link;
    }
    setActive(active);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* Back-to-top button, independent of the TOC logic above (still useful on a short post with no
   TOC) — appears after scrolling past the hero, scrolls smoothly back to the top on click. */
(function () {
  var btn = document.querySelector(".back-to-top");
  if (!btn) return;

  function update() {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
})();
