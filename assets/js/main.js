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
