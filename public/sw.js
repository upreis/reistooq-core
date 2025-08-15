// ============================================================================
// SERVICE WORKER - PWA com Offline Support para Scanner
// ============================================================================

const CACHE_NAME = 'reistoq-scanner-v1.0.0';
const API_CACHE_NAME = 'reistoq-api-v1.0.0';

// Assets críticos para funcionamento offline
const STATIC_ASSETS = [
  '/',
  '/scanner',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// APIs que devem ser cacheadas
const API_ENDPOINTS = [
  '/api/produtos',
  '/api/scanner/lookup',
  '/api/movimentacoes'
];

// ============================================================================
// INSTALAÇÃO DO SERVICE WORKER
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('🔄 [SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ [SW] Failed to cache static assets:', error);
      })
  );
});

// ============================================================================
// ATIVAÇÃO DO SERVICE WORKER
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ [SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assumir controle de todas as páginas
      self.clients.claim()
    ])
      .then(() => {
        console.log('✅ [SW] Service worker activated successfully');
      })
  );
});

// ============================================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES - ESTRATÉGIAS DE CACHE
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia para assets estáticos
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia para APIs - Cache First com fallback
  if (url.pathname.includes('/api/')) {
    event.respondWith(apiCacheStrategy(request));
    return;
  }
  
  // Estratégia para Scanner de Códigos - Network First
  if (url.pathname.includes('/scanner')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estratégia padrão - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================================================
// ESTRATÉGIAS DE CACHE
// ============================================================================

// Cache First - Para assets estáticos
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] Cache first strategy failed:', error);
    return new Response('Offline - Asset not available', { status: 503 });
  }
}

// Network First - Para Scanner (precisa de dados atualizados)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 [SW] Network failed, trying cache...');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para página offline personalizada
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Scanner não disponível offline. Reconecte à internet.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate - Para conteúdo geral
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// API Cache Strategy - Para APIs com dados de produtos
async function apiCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Para movimentações de estoque - sempre network first
  if (url.pathname.includes('movimentacoes')) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const apiCache = await caches.open(API_CACHE_NAME);
        apiCache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Em caso de erro, tentar cache apenas para GET
      if (request.method === 'GET') {
        const cachedResponse = await caches.match(request);
        return cachedResponse || offlineApiResponse();
      }
      throw error;
    }
  }
  
  // Para dados de produtos - cache first
  if (url.pathname.includes('/produtos') || url.pathname.includes('/lookup')) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Atualizar em background
      fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const apiCache = caches.open(API_CACHE_NAME);
          apiCache.then(cache => cache.put(request, networkResponse.clone()));
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const apiCache = await caches.open(API_CACHE_NAME);
        apiCache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return offlineApiResponse();
    }
  }
  
  // Fallback padrão
  return fetch(request);
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function offlineApiResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Dados não disponíveis offline',
      offline: true
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// ============================================================================
// SINCRONIZAÇÃO EM BACKGROUND
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-stock-movements') {
    event.waitUntil(syncStockMovements());
  }
});

async function syncStockMovements() {
  try {
    console.log('📦 [SW] Syncing stock movements...');
    
    // Buscar movimentações pendentes no IndexedDB
    const pendingMovements = await getPendingMovements();
    
    for (const movement of pendingMovements) {
      try {
        const response = await fetch('/api/movimentacoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(movement.data)
        });
        
        if (response.ok) {
          await removePendingMovement(movement.id);
          console.log('✅ [SW] Movement synced:', movement.id);
        }
      } catch (error) {
        console.error('❌ [SW] Failed to sync movement:', movement.id, error);
      }
    }
  } catch (error) {
    console.error('❌ [SW] Background sync failed:', error);
  }
}

// ============================================================================
// MENSAGENS DO APP
// ============================================================================
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_PRODUCT_DATA':
      cacheProductData(data);
      break;
      
    case 'STORE_PENDING_MOVEMENT':
      storePendingMovement(data);
      break;
      
    default:
      console.log('📨 [SW] Unknown message type:', type);
  }
});

async function cacheProductData(productData) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const response = new Response(JSON.stringify(productData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/api/produtos/${productData.id}`, response);
    console.log('✅ [SW] Product data cached:', productData.id);
  } catch (error) {
    console.error('❌ [SW] Failed to cache product data:', error);
  }
}

// ============================================================================
// INDEXEDDB HELPERS (movimentações offline)
// ============================================================================

async function getPendingMovements() {
  // Implementar IndexedDB para armazenar movimentações offline
  return [];
}

async function removePendingMovement(id) {
  // Implementar remoção do IndexedDB
}

async function storePendingMovement(movement) {
  // Implementar armazenamento no IndexedDB
  console.log('💾 [SW] Storing pending movement:', movement);
}

console.log('✅ [SW] Service Worker loaded successfully');