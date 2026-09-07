import { Toaster } from "@/components/ui/toaster";
import WhatsAppButton from "@/components/WhatsAppButton";
import InstallPrompt from "@/components/InstallPrompt";
import UpdateNotification from "@/components/UpdateNotification";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { SEO } from "@/components/SEO";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <>
      {/* Site-wide default social/SEO tags. Individual pages render their own
          <SEO /> which overrides these by matching `key`. */}
      <SEO url={router.asPath === "/" ? "/" : router.asPath.split("?")[0]} />
      <AnnouncementPopup />
      <div key={router.pathname} className="animate-fadeIn">
        <Component {...pageProps} />
      </div>
      <Toaster />
      <WhatsAppButton />
      <InstallPrompt />
      <UpdateNotification />
    </>
  );
}
