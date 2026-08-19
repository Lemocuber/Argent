const cache = 'argent-shell-v1'
self.addEventListener('install', event => event.waitUntil(caches.open(cache).then(store => store.addAll(['/', '/argent.svg']))))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) return
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone()
    caches.open(cache).then(store => store.put(event.request, copy))
    return response
  }).catch(() => caches.match(event.request)))
})
