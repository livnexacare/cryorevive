import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://cryorevive.onrender.com";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type PermState = "default" | "granted" | "denied" | "unsupported";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  cta_type?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  offer:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  feature: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  event:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  general: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function NotificationButton() {
  const [permState, setPermState] = useState<PermState>("default");
  const [panelOpen, setPanelOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  const getDismissed = (): string[] =>
    JSON.parse(localStorage.getItem("dismissed-announcements") || "[]");

  const fetchAnnouncements = useCallback(async (): Promise<Announcement[]> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/announcements`);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setSubLoading(true);
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
      setSubLoading(false);
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

    // Pre-fetch unread count
    fetchAnnouncements().then((data) => {
      const dismissed = getDismissed();
      setUnreadCount(data.filter((a) => !dismissed.includes(a.id)).length);
      setAnnouncements(data);
    });
  }, [subscribe, fetchAnnouncements]);

  const openPanel = async () => {
    setPanelOpen(true);
    setLoading(true);
    const data = await fetchAnnouncements();
    setAnnouncements(data);
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermState(result as PermState);
    if (result === "granted") await subscribe();
  };

  const markRead = (id: string) => {
    const d = getDismissed();
    if (!d.includes(id)) {
      localStorage.setItem("dismissed-announcements", JSON.stringify([...d, id]));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllRead = () => {
    localStorage.setItem(
      "dismissed-announcements",
      JSON.stringify(announcements.map((a) => a.id))
    );
    setUnreadCount(0);
    setPanelOpen(false);
  };

  if (permState === "unsupported") return null;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={openPanel}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        title="Notifications & Announcements"
        aria-label="Open notifications panel"
      >
        <Bell size={18} className={permState === "granted" ? "text-cyan-400" : "text-muted-foreground"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Side panel */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-gray-950 border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="text-white font-bold text-lg">Notifications</h2>
                <p className="text-gray-500 text-xs">Latest offers and updates</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Push opt-in banner */}
            {permState !== "granted" && permState !== "denied" && (
              <div className="mx-4 mt-4 p-4 bg-cyan-950/50 border border-cyan-500/30 rounded-xl">
                <p className="text-cyan-300 text-sm font-medium mb-1">🔔 Stay updated</p>
                <p className="text-gray-400 text-xs mb-3">
                  Enable push notifications for instant alerts on offers and new sessions.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {subLoading ? "Enabling…" : "Enable Notifications"}
                </button>
              </div>
            )}

            {/* Announcements list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={32} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No announcements yet</p>
                </div>
              ) : (
                announcements.map((ann) => {
                  const isRead = getDismissed().includes(ann.id);
                  const colorClass = TYPE_COLORS[ann.type] ?? TYPE_COLORS.general;

                  return (
                    <div
                      key={ann.id}
                      className={`rounded-xl border overflow-hidden transition-opacity ${
                        isRead ? "opacity-50" : "opacity-100"
                      } ${colorClass}`}
                    >
                      {ann.image_url && (
                        <img
                          src={ann.image_url}
                          alt={ann.title}
                          className="w-full object-cover"
                          style={{ maxHeight: "160px" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{ann.title}</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-3">{ann.body}</p>
                          </div>
                          {!isRead && (
                            <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {ann.cta_label && ann.cta_url && (
                          <a
                            href={ann.cta_url}
                            target={ann.cta_type === "phone" ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            onClick={() => markRead(ann.id)}
                            className="mt-2 w-full py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg text-center block transition-colors"
                          >
                            {ann.cta_type === "whatsapp" && "💬 "}
                            {ann.cta_type === "booking" && "📅 "}
                            {ann.cta_type === "phone" && "📞 "}
                            {ann.cta_label}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <button
                onClick={markAllRead}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
