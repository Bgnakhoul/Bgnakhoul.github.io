/* Progressive enhancements: figure lightbox, scroll reveal, nav highlighting. The page works without JS. */
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
})();
