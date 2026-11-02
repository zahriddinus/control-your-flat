// Control Your Flat service worker: sayt internetsiz ham ochiladi.
// Sahifalar - avval tarmoqdan, bo'lmasa keshdan. Statik fayllar (JS, CSS, rasmlar) -
// darhol keshdan, orqada yangilanadi. Supabase va ob-havo so'rovlari keshlanmaydi:
// navbatlarning oxirgi nusxasini ilovaning o'zi saqlaydi (src/utils/offline.js).
// Yangi versiya chiqqanda CACHE_NAME'dagi raqamni oshiring.

const CACHE_NAME = "control-your-flat-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./favicon.ico",
  "./logo192.png",
  "./logo512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

// Eski versiya keshlarini tozalaymiz
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Faqat o'z saytimizdagi GET so'rovlari
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Sahifalar: tarmoq, bo'lmasa keshdagi index.html (SPA: hamma yo'llar bitta sahifa)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Statik fayllar: keshdan darhol, orqada yangilanadi
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }

          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
