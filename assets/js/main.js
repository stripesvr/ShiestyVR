// Shiesty VR – view counter (backed by the Cloudflare Worker in /cloudflare-worker)
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
      boxes.forEach(function (b) { b.hidden = false; });
      animate(total);
    })
    .catch(function () { /* counter stays hidden if the Worker is unreachable */ });

  function render(n) {
    var text = Math.round(n).toLocaleString();
    document.querySelectorAll("[data-views-count]").forEach(function (el) { el.textContent = text; });
  }

  function animate(target) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target < 20) return render(target);
    var start = performance.now(), dur = 1200;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      render(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
})();

// Trailer: big play button over the poster
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

// Screenshots: open full size in a pop-up
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

// Fade sections in as they scroll into view
(function () {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 70 + "ms";
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
