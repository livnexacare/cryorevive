import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function UpdateNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => setShow(true);
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-md sm:left-auto sm:right-6 sm:bottom-24">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
          <RefreshCw size={17} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">New version available!</p>
          <p className="text-xs text-slate-400">Reload to get the latest experience.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
