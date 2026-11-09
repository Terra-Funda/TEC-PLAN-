/* TEC PLAN — service worker: abre offline; a página principal busca sempre a versão nova quando há internet */
const C = 'tecplan-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || /supabase\.co$/.test(u.hostname)) return; // dados da nuvem nunca vão para o cache
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/index.html');
  if (page) { // rede primeiro (pega atualizações), cache se estiver offline
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // bibliotecas (Three.js, fontes, voz neural): cache primeiro
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || /cdnjs|jsdelivr|huggingface|fonts\.(googleapis|gstatic)/.test(u.hostname))) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; })));
});
