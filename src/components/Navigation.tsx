import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import NotificationButton from "@/components/NotificationButton";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ChatGPT_Image_May_16_2025_05_08_10_PM.png"
              alt="CryoRevive by Livnexa Logo"
              width={120}
              height={40}
              className="h-8 md:h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-display font-bold leading-tight">CryoRevive</span>
              <span className="text-xs italic font-normal text-gray-500">by Livnexa</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <NotificationButton />
            <Link href="/booking">
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Book Now
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1.5">
            <NotificationButton />
            <Link href="/booking">
              <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-3 py-1.5 h-auto rounded-full">
                Book Now
              </Button>
            </Link>
            <button
              className="p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/booking" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
