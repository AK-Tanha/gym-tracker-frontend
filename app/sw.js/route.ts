export const dynamic = "force-dynamic";

const STATIC_ASSETS = [
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
];

const swSource = (version: string) => `
const CACHE_NAME = "statfit-static-${version}";
const STATIC_ASSETS = ${JSON.stringify(STATIC_ASSETS)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(null, { status: 503 }))
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });

      return cached || fetched;
    })
  );
});
`;

export async function GET() {
  const version =
    process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 12) ??
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
    "dev";

  return new Response(swSource(version), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}