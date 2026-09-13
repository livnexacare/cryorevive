import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { ServicesOverview } from "@/components/ServicesOverview";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Navigation as NavigationIcon } from "lucide-react";
import { fetchLivePrices, type ServicePrice } from "@/lib/pricing";

export async function getServerSideProps() {
  const prices = await fetchLivePrices();
  return { props: { prices } };
}

export default function Home({ prices = [] }: { prices: ServicePrice[] }) {
  return (
    <>
      <SEO
        title="CryoRevive - Elite Athlete Recovery | Ice Bath & Sauna Therapy"
        description="Science-backed cold plunge, steam sauna, and contrast therapy for athletes. Accelerate recovery, reduce inflammation, and optimize performance."
        url="/"
      />
      <Navigation />
      <main>
        <Hero />

        {/* CryoRevive Branding Banner */}
        <section className="w-full">
          <div className="relative w-full">
            <Image
              src="/cryo-main-image.png"
              alt="Contrast Therapy — Cold. Heat. Repeat. Perform."
              width={1920}
              height={1080}
              quality={100}
              unoptimized
              className="w-full h-auto"
            />
          </div>
        </section>

        <Benefits />
        <ServicesOverview prices={prices} />

        {/* Visit Us */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider">Visit Us</p>
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
                  Come Recover With Us
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      C-168, Omnicron 1, Mathurapur, Greater Noida
                      <br />
                      <span className="text-xs italic">Near Optimal Fitness Gym</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Mon – Sun: 7:00 AM – 9:00 PM</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/find-us">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      <NavigationIcon className="w-4 h-4 mr-2" />
                      Find Us
                    </Button>
                  </Link>
                  <Link href="/booking">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-border font-semibold">
                      Book a Session
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="w-full h-72 lg:h-96 rounded-sm overflow-hidden border border-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.8!2d77.4379!3d28.4595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cc1e5a9b72dab%3A0x9bbbebae3e15e55!2sOmicron%201%2C%20Greater%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map to CryoRevive Greater Noida"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
