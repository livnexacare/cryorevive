import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION_MS) return;

    const ios = isIOS();
    setIosMode(ios);

    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-md sm:left-auto sm:right-6 sm:bottom-24">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
          <Smartphone size={20} className="text-cyan-400" />
        </div>

        <div className="flex-1 pr-4">
          <p className="text-sm font-semibold text-white">Install CryoRevive</p>
          {iosMode ? (
            <p className="mt-1 text-xs text-slate-400">
              Tap <span className="font-medium text-cyan-400">Share</span> then{" "}
              <span className="font-medium text-cyan-400">Add to Home Screen</span> for the best experience.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Add to your home screen for quick access and offline use.
            </p>
          )}

          {!iosMode && deferredPrompt && (
            <button
              onClick={install}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-opacity hover:opacity-90"
            >
              <Download size={13} />
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
