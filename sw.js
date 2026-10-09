/* 婚礼邀请函 Service Worker
   策略：HTML 网络优先（内容更新即时生效）；静态资源缓存优先 + 后台更新（二次秒开）
   注意：替换图片/音乐后，请把下面的 CACHE 版本号 +1 */
var CACHE = "wedding-v18";
/* 仅预缓存页面骨架；相册图片数量大，改为浏览时按需进入缓存 */
var PRECACHE = [
  "./",
  "./index.html",
  "./assets/supabase.js",
  "./assets/map-lazy.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.indexOf("text/html") !== -1) {
    /* HTML：网络优先，断网回退缓存 */
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
        })
    );
    return;
  }

  /* 静态资源：缓存优先，后台静默更新（音乐等大文件首次使用时自动进入缓存） */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var fetching = fetch(req)
        .then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return hit; });
      return hit || fetching;
    })
  );
});
