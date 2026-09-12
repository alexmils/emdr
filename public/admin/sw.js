/* Admin Help web push — scope /admin/ */

function safeAdminUrl(raw) {
  var fallback = "/admin/help";
  if (!raw || typeof raw !== "string") return fallback;
  try {
    var u = new URL(raw, self.location.origin);
    if (u.origin !== self.location.origin) return fallback;
    if (u.pathname.indexOf("/admin") !== 0) return fallback;
    return u.pathname + u.search + u.hash;
  } catch (e) {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "Nura Admin",
    body: "New help message",
    url: "/admin/help",
    tag: "help-chat",
  };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    /* ignore */
  }
  const url = safeAdminUrl(data.url);
  event.waitUntil(
    self.registration.showNotification(data.title || "Nura Admin", {
      body: data.body || "New help message",
      icon: "/brand/nura-circle-variants/A-white-on-sage-128.png",
      badge: "/brand/favicon-32.png",
      tag: data.tag || "help-chat",
      data: { url },
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeAdminUrl(
    event.notification.data && event.notification.data.url
  );
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client && client.url.includes("/admin")) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
