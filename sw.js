/**
 * Service worker: lets families install esgage.ca as an app and see the
 * pages they already opened when there is no connection.
 *
 * Rule: the site always comes from the network first, so visitors never keep
 * an old copy of a page, a script or the data (events.json, sports scores).
 * The saved copy is only used when the network is down.
 * Only images and the vendor files (Bootstrap, icons) are shown from the saved
 * copy right away, and refreshed in the background.
 *
 * Changed the list below or the rules? Bump VERSION so old copies are cleared.
 * Emergency off switch: see "Application (PWA)" in README.md.
 */
var VERSION = "gage-v3";

// Saved at install so the offline page and the "Aujourd'hui" page open with no connection
var PRECACHE = [
  "/offline.html",
  "/en/offline.html",
  "/aujourdhui.html",
  "/en/aujourdhui.html",
  "/assets/css/main.css",
  "/assets/css/calendrier.css",
  "/assets/css/aujourdhui.css",
  "/assets/js/include-partials.js",
  "/assets/js/main.js",
  "/assets/js/event-icons.js",
  "/assets/js/aujourdhui.js",
  "/partials/header.html",
  "/partials/header-en.html",
  "/partials/footer.html",
  "/partials/footer-en.html",
  "/assets/data/events.json",
  "/assets/img/app/icon-192.png",
  "/assets/img/gage-logo-header.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(VERSION)
      .then(function (cache) {
        return cache.addAll(PRECACHE.map(function (url) { return new Request(url, { cache: "no-cache" }); }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function save(request, response) {
  if (response && response.ok && response.type === "basic") {
    var copy = response.clone();
    caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
  }
  return response;
}

// Network first; the saved copy only when offline
function networkFirst(request, fresh) {
  return fetch(fresh || request)
    .then(function (response) { return save(request, response); })
    .catch(function () {
      return caches.match(request, { ignoreSearch: request.mode === "navigate" }).then(function (saved) {
        if (saved) return saved;
        if (request.mode === "navigate") {
          return caches.match(new URL(request.url).pathname.indexOf("/en/") === 0 ? "/en/offline.html" : "/offline.html");
        }
        return Response.error();
      });
    });
}

// Saved copy right away, refreshed in the background (images and vendor files)
function staleWhileRevalidate(event) {
  var request = event.request;
  return caches.match(request).then(function (saved) {
    var network = fetch(request).then(function (response) { return save(request, response); });
    if (saved) {
      event.waitUntil(network.catch(function () {}));
      return saved;
    }
    return network;
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fonts, videos, Instagram… go straight to the network
  if (url.pathname.indexOf("/assets/video/") === 0) return; // videos are too big to save
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (/^\/assets\/(img|vendor)\//.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event));
  } else {
    // Pages' scripts, styles, partials and data: always ask the server if they changed
    event.respondWith(networkFirst(request, new Request(request, { cache: "no-cache" })));
  }
});
