self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/icon.png', // Ensure you have an icon.png in your frontend folder
            badge: '/icon.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                callerId: data.data.callerId,
                type: data.data.type
            },
            actions: [
                { action: 'answer', title: 'Answer Call' },
                { action: 'ignore', title: 'Ignore' }
            ],
            tag: 'incoming-call', // Prevents multiple notifications for the same call
            renotify: true,
            requireInteraction: true // Keeps notification visible until user acts
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'ignore') {
        return;
    }

    // Open the app and pass the caller info in the URL
    const urlToOpen = new URL('./index.html', self.location.origin);
    urlToOpen.searchParams.set('callerId', event.notification.data.callerId);
    urlToOpen.searchParams.set('autoAnswer', 'true');

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // If a tab is already open, focus it and navigate
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen.href && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen.href);
            }
        })
    );
});
