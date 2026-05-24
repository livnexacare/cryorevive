import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  const userInitial = user?.user_metadata?.["full_name"]
    ? (user.user_metadata["full_name"] as string).charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/ChatGPT_Image_May_16_2025_05_08_10_PM.png"
              alt="CryoRevive by Livnexa Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold leading-tight">CryoRevive</span>
              <span className="text-xs italic font-normal text-muted-foreground">by Livnexa</span>
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
            {user ? (
              <Link href="/account">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </span>
                  My Account
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
            <Link href="/booking">
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Book Now
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
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
            {user ? (
              <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </span>
                  My Account
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
            )}
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
