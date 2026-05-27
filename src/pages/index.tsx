import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { ServicesOverview } from "@/components/ServicesOverview";
import { TestimonialsPreview } from "@/components/TestimonialsPreview";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO
        title="CryoRevive - Elite Athlete Recovery | Ice Bath & Sauna Therapy"
        description="Science-backed cold plunge, steam sauna, and contrast therapy for athletes. Accelerate recovery, reduce inflammation, and optimize performance."
      />
      <Navigation />
      <main>
        <Hero />

        {/* CryoRevive Branding Banner */}
        <section className="w-full">
          <div className="relative w-full">
            <Image
              src="/cryo-branding-hero.png"
              alt="CryoRevive — Contrast Therapy. Cold. Heat. Repeat. Perform."
              width={1920}
              height={1080}
              unoptimized
              priority
              className="w-full h-auto"
            />
          </div>
        </section>

        <Benefits />
        <ServicesOverview />
        <TestimonialsPreview />
      </main>
      <Footer />
    </>
  );
}