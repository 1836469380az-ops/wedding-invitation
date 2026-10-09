/* 婚礼邀请函：地图按需加载（滚动接近地图区时才加载 Leaflet，不阻塞首屏） */
(function () {
  "use strict";
  var el = document.getElementById("map");
  if (!el) return;

  var started = false;
  function fallback() {
    el.removeAttribute("aria-busy");
    el.textContent = "地图暂时无法加载，请点击下方「一键导航」前往婚礼现场";
    el.style.cssText = "display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#536255;font-size:14px;background:#eee9dd;";
  }
  function initializeMap() {
    if (!window.L) { fallback(); return; }
    try {
      var lat = 31.353296, lng = 118.460653;
      el.textContent = "";
      var map = L.map(el, {
        center: [lat, lng], zoom: 15, zoomControl: false,
        attributionControl: true, scrollWheelZoom: false
      });
      L.tileLayer(
        "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        { subdomains: ["1", "2", "3", "4"], maxZoom: 18, attribution: "&copy; 高德地图" }
      ).addTo(map);
      var pin = L.divIcon({
        className: "", html: '<div class="wed-pin"></div>',
        iconSize: [30, 30], iconAnchor: [15, 30]
      });
      L.marker([lat, lng], { icon: pin }).addTo(map)
        .bindPopup("<b>荣悦台天鹅堡婚礼庄园</b>");
      el.removeAttribute("aria-busy");
      /* 延迟修正尺寸，防止容器在 reveal 隐藏期间初始化导致瓦片未铺满 */
      setTimeout(function () { map.invalidateSize(); }, 50);
      setTimeout(function () { map.invalidateSize(); }, 400);
    } catch (err) {
      console.warn("地图初始化失败：", err);
      fallback();
    }
  }
  function start() {
    if (started) return;
    started = true;
    el.setAttribute("aria-busy", "true");
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    style.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    style.crossOrigin = "anonymous";
    document.head.appendChild(style);

    var script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "anonymous";
    script.onload = initializeMap;
    script.onerror = fallback;
    document.head.appendChild(script);
  }
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { observer.disconnect(); start(); }
      });
    }, { rootMargin: "350px 0px" });
    observer.observe(el);
  } else {
    // 旧浏览器没有 IntersectionObserver 时，页面首次滚动/触摸后再加载。
    window.addEventListener("scroll", start, { once: true, passive: true });
    window.addEventListener("touchstart", start, { once: true, passive: true });
  }
})();
