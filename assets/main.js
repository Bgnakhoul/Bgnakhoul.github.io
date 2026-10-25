/* Progressive enhancements: figure lightbox, scroll reveal, nav highlighting, Smith-chart impedance sweep.
   The page works without JS. */
(function () {
  "use strict";

  // ---- Lightbox for figures -------------------------------------------------
  var box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Enlarged figure");

  var closeBtn = document.createElement("button");
  closeBtn.className = "lb-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close enlarged figure");
  closeBtn.textContent = "×";

  var bigImg = document.createElement("img");
  bigImg.alt = "";
  var cap = document.createElement("p");
  cap.className = "lb-cap";

  box.appendChild(closeBtn);
  box.appendChild(bigImg);
  box.appendChild(cap);
  document.body.appendChild(box);

  var lastFocus = null;

  function openBox(img) {
    var fig = img.closest("figure");
    var c = fig ? fig.querySelector("figcaption") : null;
    lastFocus = document.activeElement;
    bigImg.src = img.currentSrc || img.src;
    bigImg.alt = img.alt || "";
    cap.textContent = c ? c.textContent.trim() : "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeBox() {
    box.hidden = true;
    bigImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("figure.zoom img").forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Enlarge figure: " + (img.alt || "figure"));
    img.addEventListener("click", function () { openBox(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(img); }
    });
  });

  closeBtn.addEventListener("click", closeBox);
  box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) closeBox();
  });

  // ---- Scroll reveal ----------------------------------------------------------
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { rio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Highlight the current section in the nav ------------------------------
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          byId[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  // ---- Smith chart: decorative impedance sweep driven by scroll ---------------
  // The reflection coefficient spirals from a badly mismatched load (|Γ| = 0.92)
  // to the centre of the chart (Γ = 0, Z = Z0) as you scroll down the page.
  var smith = document.querySelector(".smith");
  if (smith) {
    var locus = smith.querySelector(".locus");
    var locusBg = smith.querySelector(".locus-bg");
    var dot = smith.querySelector(".dot");
    var halo = smith.querySelector(".dot-halo");
    var hud = document.querySelector(".hud");
    var hudT = hud ? hud.querySelector(".hud-t") : null;
    var hG = document.getElementById("h-g");
    var hA = document.getElementById("h-a");
    var hV = document.getElementById("h-v");
    var hZ = document.getElementById("h-z");
    var CX = 500, CY = 500, RAD = 425, STEPS = 260;
    var RHO0 = 0.92, TURNS = 810; // start magnitude, total sweep in degrees

    var gam = function (t) {
      var rho = RHO0 * Math.pow(1 - t, 1.15);
      var th = (-125 - TURNS * t) * Math.PI / 180;
      return { rho: rho, re: rho * Math.cos(th), im: rho * Math.sin(th) };
    };
    var xy = function (g) { return [CX + RAD * g.re, CY - RAD * g.im]; };

    var d = "";
    for (var i = 0; i <= STEPS; i++) {
      var p = xy(gam(i / STEPS));
      d += (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
    }
    locusBg.setAttribute("d", d);
    locus.setAttribute("d", d);
    locus.setAttribute("pathLength", "1");

    var ticking = false;
    var render = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      var g = gam(t);
      var pt = xy(g);
      locus.style.strokeDasharray = t.toFixed(4) + " 2";
      locus.style.opacity = t < 0.004 ? 0 : 1;
      dot.setAttribute("cx", pt[0].toFixed(1)); dot.setAttribute("cy", pt[1].toFixed(1));
      halo.setAttribute("cx", pt[0].toFixed(1)); halo.setAttribute("cy", pt[1].toFixed(1));
      if (!hud) return;
      var den = (1 - g.re) * (1 - g.re) + g.im * g.im;
      var zr = (1 - g.rho * g.rho) / den, zi = 2 * g.im / den;
      var ang = Math.round(Math.atan2(g.im, g.re) * 180 / Math.PI);
      var vswr = (1 + g.rho) / (1 - Math.min(g.rho, 0.9999));
      hG.textContent = g.rho.toFixed(2);
      hA.textContent = g.rho < 0.005 ? "∠ —" : "∠ " + (ang < 0 ? "−" : "") + Math.abs(ang) + "°";
      hV.textContent = vswr >= 10 ? Math.round(vswr) : vswr.toFixed(1);
      hZ.textContent = zr.toFixed(2) + (zi < 0 ? " − j" : " + j") + Math.abs(zi).toFixed(2);
      var matched = t > 0.985;
      hud.classList.toggle("ok", matched);
      if (hudT) hudT.textContent = matched ? "matched" : "Γ sweep";
    };
    var onScroll = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", render);
    render();
  }
})();
