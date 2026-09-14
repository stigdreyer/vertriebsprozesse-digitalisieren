// Shared engine for score-based Werkzeugkasten self-tests (layouts/werkzeugkasten/CLAUDE.md).
// Vanilla JS, no build step — same convention as configurator.js/nav-toggle.js/proof-reveal.js.
//
// Revised 2026-09-13 to step through .tool-cluster groups one at a time (Weiter/Zurück) instead of
// showing all 15 questions in one long scroll. This is purely a client-side visibility toggle over
// markup that is already fully present in the server-rendered HTML — every question stays in the
// initial page response regardless of step state, so this has no SEO/GEO cost (see the print
// override in assets/styles.css, which forces every step visible when printed, and
// layouts/werkzeugkasten/CLAUDE.md for the full rationale). Falls back to a single implicit step
// (old flat behavior) if a tool has no .tool-cluster wrappers at all.
//
// Revised again 2026-09-13 (same day) to add: a decorative stepper built from the real cluster count
// and each cluster's own icon, a rotating SVG gauge needle on the result panel, and multi-element
// [data-tool-top-cause] fill (the personalized bridge lead-in needs its own copy of the same value
// already shown in .tool-result-summary).
//
// One tool markup contract, reused by every score-type tool instead of one script per tool:
//
//   <div data-tool-stepper aria-hidden="true"></div>  (optional — built from .tool-cluster icons)
//   <form data-tool="score">
//     <div class="tool-cluster">
//       <div class="tool-cluster-heading">
//         <span class="tool-cluster-icon"><svg><use href="#tool-icon-x"></use></svg></span>
//         <h2>Ursache 1 von 5 – ...</h2>
//       </div>
//       <fieldset data-tool-group data-cause="Ursache-Label">
//         <legend>...</legend>
//         <input type="radio" name="q1" data-score="0"> ...
//       </fieldset>
//       ...
//     </div>
//     ... (repeat .tool-cluster)
//     <div class="tool-progress-row">
//       <button data-tool-back disabled>← Zurück</button>
//       <p data-tool-progress></p>
//       <button data-tool-next disabled>Weiter →</button>
//     </div>
//   </form>
//   <div data-tool-result hidden>
//     <div class="tool-gauge" aria-hidden="true"><svg>...<g data-tool-gauge-needle>...</g></svg></div>  (optional)
//     <p>Gesundheits-Score: <strong data-tool-total></strong> von <strong data-tool-max></strong></p>
//     <p>Stärkste Ursache bei euch: <strong data-tool-top-cause></strong></p>
//     ... any number of further [data-tool-top-cause] elements elsewhere on the page — all get filled ...
//     <div data-band-min="0" data-band-max="8">...</div>
//     <div data-band-min="9" data-band-max="18">...</div>
//     <div data-band-min="19" data-band-max="30">...</div>
//     <button type="button" data-tool-reset>Neu starten</button>
//   </div>
//
// Displayed total is INVERTED from the raw problem-total (2026-09-13, after two rounds of feedback
// that "X von 30" reading as a bare score made the worst outcome (30/30) look like the best one — a
// fraction hitting its own maximum reads as "full marks" by cultural default, no matter what label
// sits next to it). Band matching below still uses the raw, un-inverted total (0 = healthiest,
// max = worst) exactly as the data-band-min/max attributes are written — only the number shown to
// the visitor is flipped (maxPossible - total), so 30/30 genuinely means "healthiest possible" and
// 0/30 means "worst possible," matching how everyone already reads an X-out-of-Y number. maxPossible
// is computed from the DOM (each group's own highest data-score, summed) rather than hardcoded, so a
// future tool with a different question count or answer scale doesn't need a matching hardcoded
// number anywhere in its markdown.
(function () {
  function initScoreTool(form) {
    var clusters = Array.prototype.slice.call(form.querySelectorAll('.tool-cluster'));
    var groups = Array.prototype.slice.call(form.querySelectorAll('[data-tool-group]'));
    var backBtn = form.querySelector('[data-tool-back]');
    var nextBtn = form.querySelector('[data-tool-next]');
    var progressEl = form.querySelector('[data-tool-progress]');
    // Stepper and result panel are deliberately looked up from `document`, not `form` — both live
    // outside the <form> element in the markup (stepper just before it, result panel just after it),
    // same reasoning `resultPanel` already used before this revision.
    var stepperEl = document.querySelector('[data-tool-stepper]');
    var resultPanel = document.querySelector('[data-tool-result]');
    var totalEl = resultPanel ? resultPanel.querySelector('[data-tool-total]') : null;
    var maxEl = resultPanel ? resultPanel.querySelector('[data-tool-max]') : null;
    var causeEls = resultPanel ? Array.prototype.slice.call(document.querySelectorAll('[data-tool-top-cause]')) : [];
    var gaugeNeedle = resultPanel ? resultPanel.querySelector('[data-tool-gauge-needle]') : null;
    var bands = resultPanel ? Array.prototype.slice.call(resultPanel.querySelectorAll('[data-band-min]')) : [];
    var resetBtn = resultPanel ? resultPanel.querySelector('[data-tool-reset]') : null;

    function groupMaxScore(g) {
      var scores = Array.prototype.slice.call(g.querySelectorAll('input[data-score]')).map(function (input) {
        return parseInt(input.getAttribute('data-score'), 10) || 0;
      });
      return scores.length ? Math.max.apply(null, scores) : 0;
    }

    var maxPossible = groups.reduce(function (sum, g) {
      return sum + groupMaxScore(g);
    }, 0);
    if (maxEl) maxEl.textContent = String(maxPossible);

    // No clusters at all -> treat the whole form as one implicit step (backward-compatible fallback).
    var totalSteps = clusters.length || 1;
    var currentStep = 0;

    // Stepper dots are built here, once, from the real clusters — never hand-authored to match, so a
    // future tool with a different cluster count "just works" without a matching change anywhere
    // else. Each dot clones whichever icon that cluster's own heading already uses (via <use href>),
    // so the icon set has exactly one source of truth (the cluster markup itself).
    var stepperDots = [];
    if (stepperEl && clusters.length) {
      clusters.forEach(function (cluster) {
        var dot = document.createElement('span');
        dot.className = 'tool-stepper-dot';
        var iconUse = cluster.querySelector('.tool-cluster-icon use');
        if (iconUse) {
          var href = iconUse.getAttribute('href');
          dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="' + href + '"></use></svg>';
        }
        stepperEl.appendChild(dot);
        stepperDots.push(dot);
      });
    }

    function groupsInStep(i) {
      if (!clusters.length) return groups;
      return Array.prototype.slice.call(clusters[i].querySelectorAll('[data-tool-group]'));
    }

    function stepAnswered(i) {
      return groupsInStep(i).every(function (g) {
        return g.querySelector('input:checked');
      });
    }

    function isLastStep(i) {
      return i === totalSteps - 1;
    }

    function showStep(i, opts) {
      var moveFocus = opts && opts.moveFocus;
      // Only a user-triggered Zurück/Weiter/Neu-starten click scrolls — the initial call on page
      // load must NOT (found while investigating an unrelated spacing report: every page load was
      // jumping straight down to the form, since this used to run unconditionally here).
      var scroll = opts && opts.scroll;
      clusters.forEach(function (cluster, idx) {
        cluster.hidden = idx !== i;
      });
      if (backBtn) backBtn.disabled = i === 0;
      if (nextBtn) {
        nextBtn.disabled = !stepAnswered(i);
        nextBtn.textContent = isLastStep(i) ? 'Ergebnis berechnen →' : 'Weiter →';
      }
      if (progressEl) progressEl.textContent = 'Schritt ' + (i + 1) + ' von ' + totalSteps;

      stepperDots.forEach(function (dot, idx) {
        dot.classList.toggle('is-current', idx === i);
        dot.classList.toggle('is-done', idx < i);
      });

      if (clusters.length) {
        var heading = clusters[i].querySelector('h2');
        if (heading) {
          if (moveFocus) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }
        }
      }
      // Scroll to the stepper when one exists, not the form — the stepper sits just *before* the
      // form in the markup, so scrolling to the form alone can never bring it into view (it would
      // already be scrolled past). Falls back to the form for a tool with no stepper. Both carry
      // scroll-margin-top in CSS so the sticky nav doesn't cover whichever one ends up on top —
      // found live: without it, "Weiter" scrolled the stepper/heading in behind the nav, making it
      // look like they'd vanished.
      if (scroll) (stepperEl || form).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateNextEnabled() {
      if (nextBtn) nextBtn.disabled = !stepAnswered(currentStep);
    }

    function compute() {
      var total = 0;
      var causeScores = {};

      groups.forEach(function (g) {
        var checked = g.querySelector('input:checked');
        if (!checked) return;
        var score = parseInt(checked.getAttribute('data-score'), 10) || 0;
        total += score;
        var cause = g.getAttribute('data-cause');
        if (cause) causeScores[cause] = (causeScores[cause] || 0) + score;
      });

      var displayed = maxPossible - total;
      if (totalEl) totalEl.textContent = String(displayed);

      // Collects every cause tied for the top score, not just the first one seen — a plain ">"
      // comparison here used to silently keep whichever cause was inserted first (cluster order)
      // on any tie, which in practice meant a fully tied answer set always reported "Tool vor
      // Prozess ausgewählt" regardless of the real answers (found live, 2026-09-13: a deliberate
      // Ja/Teilweise/Nein-per-cause test, tied 3-all-round, still reported cluster 1 every time).
      var topScore = -1;
      var topCauses = [];
      Object.keys(causeScores).forEach(function (cause) {
        if (causeScores[cause] > topScore) {
          topScore = causeScores[cause];
          topCauses = [cause];
        } else if (causeScores[cause] === topScore) {
          topCauses.push(cause);
        }
      });
      var topCauseText = null;
      if (topCauses.length === 1) {
        topCauseText = topCauses[0];
      } else if (topCauses.length === 2) {
        topCauseText = topCauses.join(' und ');
      } else if (topCauses.length > 2) {
        // 3+ tied causes read as an unwieldy list in a one-line stat/sentence — named generically
        // instead. Consistent with the tool's own copy ("diese Ursachen treten fast nie isoliert
        // auf"), so this isn't a workaround, it's the honest answer in that specific case.
        topCauseText = 'mehrere Ursachen gleichauf';
      }
      if (topCauseText) {
        causeEls.forEach(function (el) {
          el.textContent = topCauseText;
        });
      }

      // Gauge needle: -90deg (pointing left) at the worst possible score, +90deg (pointing right) at
      // the best possible score, matching the displayed (healthy-framed) number — same "higher =
      // better" direction as the text stat next to it, never the raw problem-total directly.
      if (gaugeNeedle && maxPossible > 0) {
        var fraction = displayed / maxPossible;
        var angle = -90 + fraction * 180;
        gaugeNeedle.style.transform = 'rotate(' + angle + 'deg)';
      }

      bands.forEach(function (band) {
        var min = parseInt(band.getAttribute('data-band-min'), 10);
        var max = parseInt(band.getAttribute('data-band-max'), 10);
        band.hidden = !(total >= min && total <= max);
      });

      if (resultPanel) {
        resultPanel.hidden = false;
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    groups.forEach(function (g) {
      g.addEventListener('change', updateNextEnabled);
    });

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (currentStep > 0) {
          currentStep -= 1;
          showStep(currentStep, { moveFocus: true, scroll: true });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!isLastStep(currentStep)) {
          currentStep += 1;
          showStep(currentStep, { moveFocus: true, scroll: true });
        } else {
          compute();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        groups.forEach(function (g) {
          Array.prototype.slice.call(g.querySelectorAll('input')).forEach(function (input) {
            input.checked = false;
          });
        });
        if (resultPanel) resultPanel.hidden = true;
        currentStep = 0;
        showStep(currentStep, { moveFocus: false, scroll: true });
      });
    }

    showStep(0, { moveFocus: false });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-tool="score"]')).forEach(initScoreTool);
})();
