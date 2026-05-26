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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Elite Recovery Technology
              </p>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight tracking-tight">
              Recover Harder.
              <br />
              <span className="text-primary">Come Back</span>{" "}
              <span className="text-accent">Stronger.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
              Science-backed cold plunge and heat therapy for athletes who demand peak performance. Accelerate recovery, reduce inflammation, and optimize your body.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/booking">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                >
                  Book Your Session
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-card font-semibold"
                >
                  Explore Services
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-primary">
                  <Thermometer className="h-5 w-5" />
                  <span className="text-2xl font-display font-bold">-10°C</span>
                </div>
                <p className="text-xs text-muted-foreground">Cold Plunge</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-accent">
                  <Thermometer className="h-5 w-5" />
                  <span className="text-2xl font-display font-bold">90°C</span>
                </div>
                <p className="text-xs text-muted-foreground">Steam Sauna</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-foreground">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-display font-bold">3x</span>
                </div>
                <p className="text-xs text-muted-foreground">Faster Recovery</p>
              </div>
            </div>
          </div>

          <div className="relative lg:h-[600px] h-[400px] rounded-sm overflow-hidden border border-primary/30">
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <Image
                  src="/ice-bath-therapy.png"
                  alt="Ice Bath Therapy Chamber"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-primary/20"></div>
              </div>
              <div className="relative">
                <Image
                  src="/steam-sauna.png"
                  alt="Steam Sauna Interior"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-accent/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}