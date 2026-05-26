import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://cryorevive.onrender.com";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type PermState = "default" | "granted" | "denied" | "unsupported";

export default function NotificationButton() {
  const [permState, setPermState] = useState<PermState>("default");
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch (err) {
      console.error("Push subscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermState("unsupported");
      return;
    }
    const perm = Notification.permission as PermState;
    setPermState(perm);

    if (perm === "granted") {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => { if (!sub) subscribe(); })
        .catch(() => {});
    }
  }, [subscribe]);

  const handleClick = async () => {
    if (permState === "granted" || permState === "denied" || permState === "unsupported") return;
    const result = await Notification.requestPermission();
    // Update icon immediately — before subscribe() resolves
    setPermState(result as PermState);
    if (result === "granted") {
      await subscribe();
    }
  };

  if (permState === "unsupported") return null;

  const title =
    permState === "granted"
      ? "✅ Notifications enabled"
      : permState === "denied"
      ? "🚫 Notifications blocked — check browser settings"
      : "🔔 Enable notifications for offers and updates";

  return (
    <button
      onClick={handleClick}
      disabled={loading || permState === "denied" || permState === "granted"}
      title={title}
      aria-label={title}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
    >
      {permState === "granted" ? (
        <Bell size={18} className="text-cyan-400" />
      ) : (
        <BellOff size={18} />
      )}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </span>
      )}
    </button>
  );
}
