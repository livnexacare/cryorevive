import { Toaster } from "@/components/ui/toaster";
import WhatsAppButton from "@/components/WhatsAppButton";
import InstallPrompt from "@/components/InstallPrompt";
import UpdateNotification from "@/components/UpdateNotification";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AnnouncementBanner />
      <Component {...pageProps} />
      <Toaster />
      <WhatsAppButton />
      <InstallPrompt />
      <UpdateNotification />
    </>
  );
}
