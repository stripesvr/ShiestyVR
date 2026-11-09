// Shiesty VR – site scripts ✨
window.SHIESTY_READY = true;
var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var FINE_POINTER = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- View counter (Cloudflare Worker in /cloudflare-worker) ----------
(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var meta = document.querySelector('meta[name="shiesty-views-api"]');
  var api = meta ? meta.content.trim().replace(/\/+$/, "") : "";
  var boxes = document.querySelectorAll("[data-views]");
  if (!api || !boxes.length || !window.fetch) return;

  // Count each visitor once per browser session; later page loads just read the total.
  var KEY = "shiesty-viewed";
  var counted = false;
  try { counted = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

  var req = counted
    ? fetch(api + "/count", { cache: "no-store" })
    : fetch(api + "/hit", { method: "POST", cache: "no-store" });

  req
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var total = Number(data && data.count);
      if (!isFinite(total) || total < 0) return;
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      document.querySelectorAll("[data-views-count]").forEach(function (el) { el.textContent = total.toLocaleString(); });
      boxes.forEach(function (b) { b.hidden = false; });
    })
    .catch(function () { /* counter stays hidden if the Worker is unreachable */ });
})();

// ---------- Scroll progress bar ----------
(function () {
  var bar = document.querySelector(".progress");
  if (!bar) return;
  var ticking = false;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

// ---------- Hero background video ----------
(function () {
  var v = document.querySelector(".hero__video");
  if (!v) return;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (REDUCED || saveData) { v.pause(); v.removeAttribute("autoplay"); return; }
  var p = v.play();
  if (p && p.catch) p.catch(function () {});
})();

// ---------- Key art 3D tilt ----------
(function () {
  var art = document.querySelector("[data-tilt]");
  if (!art || REDUCED || !FINE_POINTER) return;
  var zone = art.closest(".hero") || art;
  zone.addEventListener("pointermove", function (e) {
    var r = art.getBoundingClientRect();
    var x = (e.clientX - (r.left + r.width / 2)) / r.width;
    var y = (e.clientY - (r.top + r.height / 2)) / r.height;
    art.style.setProperty("--ry", (Math.max(-1, Math.min(1, x)) * 7).toFixed(2) + "deg");
    art.style.setProperty("--rx", (Math.max(-1, Math.min(1, -y)) * 5).toFixed(2) + "deg");
  });
  zone.addEventListener("pointerleave", function () {
    art.style.setProperty("--ry", "0deg");
    art.style.setProperty("--rx", "0deg");
  });
})();

// ---------- Spotlight cards ----------
(function () {
  if (!FINE_POINTER) return;
  document.querySelectorAll(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
})();

// ---------- Trailer: big play button over the poster ----------
(function () {
  var video = document.getElementById("trailer-video");
  var btn = document.querySelector(".video__play");
  if (!video || !btn) return;
  btn.addEventListener("click", function () {
    video.parentElement.classList.add("is-playing");
    video.controls = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
    video.focus();
  });
})();

// ---------- Screenshot strip arrows ----------
(function () {
  var strip = document.querySelector(".strip");
  if (!strip) return;
  document.querySelectorAll("[data-strip]").forEach(function (b) {
    b.addEventListener("click", function () {
      var dir = Number(b.getAttribute("data-strip"));
      var item = strip.querySelector("figure");
      var step = item ? item.getBoundingClientRect().width + 18 : strip.clientWidth * 0.8;
      strip.scrollBy({ left: dir * step, behavior: REDUCED ? "auto" : "smooth" });
    });
  });
})();

// ---------- Screenshots: open full size in a pop-up ----------
(function () {
  var box = document.getElementById("lightbox");
  if (!box || typeof box.showModal !== "function") return; // old browsers just follow the link
  var img = box.querySelector("img");
  document.querySelectorAll("[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var thumb = a.querySelector("img");
      img.src = a.getAttribute("href");
      img.alt = thumb ? thumb.alt : "";
      box.showModal();
    });
  });
  box.querySelector(".lightbox__close").addEventListener("click", function () { box.close(); });
  box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
})();

// ---------- Vibe-coding terminal: types itself out when scrolled into view ----------
(function () {
  var term = document.querySelector("[data-terminal]");
  if (!term || REDUCED || !("IntersectionObserver" in window)) return;
  var lines = Array.prototype.slice.call(term.querySelectorAll(".term__line"));
  var typed = term.querySelector("[data-type]");
  var full = typed ? typed.textContent : "";
  lines.forEach(function (l, i) { if (i > 0) l.classList.add("is-hidden"); });
  if (typed) typed.textContent = "";

  var io = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    var i = 1;
    function nextLine() {
      if (i >= lines.length) return;
      var line = lines[i];
      line.classList.remove("is-hidden");
      if (typed && line.contains(typed)) {
        var n = 0;
        (function type() {
          typed.textContent = full.slice(0, ++n);
          if (n < full.length) setTimeout(type, 22 + Math.random() * 30);
          else { i++; setTimeout(nextLine, 450); }
        })();
      } else {
        i++;
        setTimeout(nextLine, i === 3 ? 900 : 380);
      }
    }
    setTimeout(nextLine, 400);
  }, { threshold: 0.35 });
  io.observe(term);
})();

// ---------- Confetti (donuts, cash and diamonds) ----------
(function () {
  if (REDUCED || !Element.prototype.animate) return;
  var EMOJI = ["🍩", "💸", "💎", "💰", "🚓", "🦝", "✨", "⭐"];
  function burst(x, y) {
    for (var k = 0; k < 34; k++) {
      var s = document.createElement("span");
      s.className = "confetti";
      s.textContent = EMOJI[Math.floor(Math.random() * EMOJI.length)];
      s.style.fontSize = (18 + Math.random() * 22) + "px";
      document.body.appendChild(s);
      var angle = Math.random() * Math.PI * 2;
      var speed = 120 + Math.random() * 260;
      var dx = Math.cos(angle) * speed;
      var dy = Math.sin(angle) * speed - 180;
      var rot = (Math.random() - 0.5) * 720;
      var anim = s.animate([
        { transform: "translate(" + x + "px," + y + "px) translate(-50%,-50%) rotate(0deg) scale(0.6)", opacity: 1 },
        { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) translate(-50%,-50%) rotate(" + rot / 2 + "deg) scale(1)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + (x + dx * 1.3) + "px," + (y + dy + 420) + "px) translate(-50%,-50%) rotate(" + rot + "deg) scale(0.9)", opacity: 0 }
      ], { duration: 1400 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }
  document.querySelectorAll("[data-confetti]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var r = el.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    });
  });
})();

// ---------- Fade sections in as they scroll into view ----------
(function () {
  var items = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 80 + "ms";
      el.classList.add("is-in");
      el.addEventListener("transitionend", function clear() { el.style.transitionDelay = ""; el.removeEventListener("transitionend", clear); });
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
