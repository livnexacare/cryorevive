import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Thermometer, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:py-20">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <div className="space-y-5 md:space-y-8">
            <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/30 rounded-sm">
              <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">
                Elite Recovery Technology
              </p>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-bold leading-tight tracking-tight">
              Recover Harder.
              <br />
              <span className="text-primary">Come Back</span>{" "}
              <span className="text-accent">Stronger.</span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Science-backed cold plunge and heat therapy for athletes who demand peak performance. Accelerate recovery, reduce inflammation, and optimize your body.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link href="/booking?tab=event" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto py-3 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl group"
                >
                  Book Your Session
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto py-3 text-sm font-semibold border-border hover:bg-card rounded-xl"
                >
                  Explore Services
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border">
              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <div className="flex items-center gap-1 text-primary">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-xl font-display font-bold">-10°C</span>
                </div>
                <p className="text-xs text-gray-400">Cold Plunge</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <div className="flex items-center gap-1 text-accent">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-xl font-display font-bold">90°C</span>
                </div>
                <p className="text-xs text-gray-400">Steam Sauna</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <div className="flex items-center gap-1 text-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xl font-display font-bold">3x</span>
                </div>
                <p className="text-xs text-gray-400">Faster Recovery</p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 lg:mt-0 w-full overflow-hidden rounded-2xl border border-primary/30
                         h-[320px] sm:h-[420px] md:h-[480px] lg:h-[540px] xl:h-[600px]">
            <Image
              src="/cryo-branding-hero.png"
              alt="CryoRevive — Elite Recovery"
              fill
              priority
              quality={100}
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}