import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
              <Image
                src="/ChatGPT_Image_May_16_2025_05_08_10_PM.png"
                alt="CryoRevive by Livnexa Logo"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-base md:text-xl font-display font-bold leading-tight">CryoRevive</span>
                <span className="text-xs italic font-normal text-muted-foreground">by Livnexa</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Elite recovery facility for athletes. Cold plunge, steam sauna, and contrast therapy.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-center md:text-left">Quick Links</h3>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2 text-sm">
              <li><Link href="/booking" className="text-muted-foreground hover:text-foreground">Book a Session</Link></li>
              <li><Link href="/booking?tab=event" className="text-muted-foreground hover:text-foreground">Mobile Event</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 md:mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">B-94, Sector 36, Greater Noida, UP</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="tel:9891430920" className="text-muted-foreground hover:text-foreground">9891430920</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="mailto:info@cryorevive.in" className="text-muted-foreground hover:text-foreground">info@cryorevive.in</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-center text-muted-foreground">© {new Date().getFullYear()} CryoRevive by Livnexa. All rights reserved.</p>
          <Link href="/admin" className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <Shield className="w-3 h-3" />
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
