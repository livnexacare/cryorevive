import { Navigation } from "@/components/Navigation";
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
        <Benefits />
        <ServicesOverview />
        <TestimonialsPreview />
      </main>
    </>
  );
}