const swSelf = self as unknown as ServiceWorkerGlobalScope;

swSelf.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json() as { title?: string; body?: string; url?: string };
  event.waitUntil(
    swSelf.registration.showNotification(data.title ?? "CryoRevive", {
      body: data.body ?? "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: { url: data.url ?? "/" },
    })
  );
});

swSelf.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";
  event.waitUntil(
    swSelf.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url === url && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        return swSelf.clients.openWindow(url);
      })
  );
});
