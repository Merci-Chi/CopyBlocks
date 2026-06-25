const CACHE_NAME = "copy-blocks-v3";
const APP_PAGE = "./CopyBlocks.html";
const APP_SHELL = [
  APP_PAGE,
  "./manifest.webmanifest",
  "./dark-manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/dark-icon-192.png",
  "./icons/dark-icon-512.png"
];

function appShellResponse() {
  return caches
    .match(APP_PAGE, { ignoreSearch: true })
    .then((response) => response || fetch(APP_PAGE));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("copy-blocks-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate" && sameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) return response;
          return appShellResponse();
        })
        .catch(() => appShellResponse()),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && sameOrigin) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
