import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://cryorevive.onrender.com";
const DISMISSED_KEY = "cryo-dismissed-ann";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "general" | "offer" | "feature" | "event";
  url: string;
}

const TYPE_STYLES: Record<string, string> = {
  offer: "announcement-offer border-amber-500/30 text-white",
  feature: "bg-cyan-900/80 border-cyan-500/30 text-cyan-100",
  event: "bg-purple-900/80 border-purple-500/30 text-purple-100",
  general: "bg-slate-800/90 border-slate-600/30 text-slate-200",
};

export default function AnnouncementBanner() {
  const router = useRouter();
  const [ann, setAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    if (router.pathname.startsWith("/admin")) return;

    const dismissed = JSON.parse(
      localStorage.getItem(DISMISSED_KEY) ?? "[]"
    ) as string[];

    fetch(`${API_URL}/api/notifications/announcements`)
      .then((r) => r.json())
      .then((data: Announcement[]) => {
        const next = data.find((a) => !dismissed.includes(a.id));
        if (next) setAnn(next);
      })
      .catch(() => {});
  }, [router.pathname]);

  const dismiss = () => {
    if (!ann) return;
    const dismissed = JSON.parse(
      localStorage.getItem(DISMISSED_KEY) ?? "[]"
    ) as string[];
    dismissed.push(ann.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setAnn(null);
  };

  if (!ann) return null;

  const style = TYPE_STYLES[ann.type] ?? TYPE_STYLES.general;

  return (
    <div
      className={`w-full border-b px-4 py-2.5 flex items-center gap-3 text-sm ${style}`}
    >
      <p className="flex-1">
        <span className="font-semibold">{ann.title}</span>
        {" — "}
        {ann.body}
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
