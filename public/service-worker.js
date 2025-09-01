// Service Worker para Push Notifications e PWA
const CACHE_NAME = 'support-app-v1'
const urlsToCache = [
  '/',
  '/offline.html'
]

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened')
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
          })
      })
  )
})

// Push event - show notification
self.addEventListener('push', event => {
  console.log('Push event received:', event)
  
  let data = {
    title: 'Nova Notificação',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    data: {}
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        ...data,
        ...payload,
        data: payload.data || {}
      }
    } catch (e) {
      console.error('Error parsing push data:', e)
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || `notification-${Date.now()}`,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    data: data.data,
    actions: data.actions || []
  }

  // Add action buttons for certain notification types
  if (data.type === 'ticket_assigned' || data.type === 'ticket_created') {
    options.actions = [
      {
        action: 'view',
        title: 'Ver Chamado',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icon-close.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event)
  event.notification.close()

  const data = event.notification.data || {}
  let url = '/'

  // Handle action buttons
  if (event.action === 'view' && data.action_url) {
    url = data.action_url
  } else if (event.action === 'dismiss') {
    return // Just close the notification
  } else if (data.action_url) {
    // Default click - open action URL
    url = data.action_url
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(url)
            return
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    // Get all pending notifications from IndexedDB or cache
    const cache = await caches.open('notification-sync')
    const requests = await cache.keys()
    
    for (const request of requests) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.delete(request)
        }
      } catch (error) {
        console.error('Failed to sync notification:', error)
      }
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications())
  }
})

async function checkForNewNotifications() {
  try {
    const response = await fetch('/api/notifications/check')
    if (response.ok) {
      const data = await response.json()
      if (data.hasNew) {
        self.registration.showNotification('Novas Notificações', {
          body: `Você tem ${data.count} nova(s) notificação(ões)`,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: 'new-notifications',
          data: { action_url: '/dashboard/notifications' }
        })
      }
    }
  } catch (error) {
    console.error('Failed to check notifications:', error)
  }
}

// Message event for communication with the app
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data.type === 'CHECK_NOTIFICATIONS') {
    checkForNewNotifications()
  } else if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
})