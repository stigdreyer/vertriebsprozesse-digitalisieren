/* Triggers the "fragmented steps collapse into one result" reveal on the homepage proof-tile
   cards (assets/styles.css .proof-collapse) once each card scrolls into view. Runs unconditionally;
   the actual animation only exists under `@media (prefers-reduced-motion: no-preference)` in CSS,
   same gating pattern as .blob/.tools-track, so this script is a no-op visually for reduced-motion
   users even though it still adds the class. */
(function () {
  var targets = document.querySelectorAll(".proof-collapse");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  targets.forEach(function (el) { observer.observe(el); });
})();
