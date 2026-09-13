import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Navigation as NavigationIcon, Truck, Sparkles } from "lucide-react";
import Link from "next/link";

interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  mapUrl: string;
  embedUrl: string;
  hours: string;
  services: string[];
}

const STORES: Store[] = [
  {
    id: 1,
    name: "CryoRevive Studio — Greater Noida",
    address: "C-168, Omnicron 1, Mathurapur",
    city: "Greater Noida",
    state: "Uttar Pradesh",
    pincode: "",
    landmark: "Near Optimal Fitness Gym",
    mapUrl: "https://maps.google.com/?q=C-168+Omnicron+1+Mathurapur+Greater+Noida",
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.8!2d77.4379!3d28.4595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cc1e5a9b72dab%3A0x9bbbebae3e15e55!2sOmicron%201%2C%20Greater%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1",
    hours: "Mon – Sun: 7:00 AM – 9:00 PM",
    services: ["Ice Bath", "Steam Sauna", "Contrast Therapy", "Cryo Chamber", "Physiotherapy"],
  },
];

const COMING_SOON_CITIES = ["Delhi", "Gurugram", "Noida Sector 62"];

export default function FindUs() {
  return (
    <>
      <SEO
        title="Find Us | CryoRevive — Studio Locations & Mobile Recovery Unit"
        description="Visit the CryoRevive recovery studio in Greater Noida, or book our Mobile Recovery Unit for events anywhere in Delhi NCR."
        url="/find-us"
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Find Us
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Our Studio &amp; Mobile Unit
              </h1>
              <p className="text-lg text-muted-foreground">
                Walk into our Greater Noida studio, or bring CryoRevive to your event anywhere in Delhi NCR.
              </p>
            </div>
          </div>
        </section>

        {/* Studio Locations */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold mb-8 text-center">Studio Locations</h2>
            <div className="grid lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
              {STORES.map((store) => (
                <Card key={store.id} className="bg-card border-border overflow-hidden">
                  <div className="grid md:grid-cols-2">
                    <div className="w-full h-64 md:h-auto bg-muted">
                      <iframe
                        src={store.embedUrl}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map to ${store.name}`}
                      />
                    </div>
                    <CardContent className="p-6 sm:p-8 space-y-4">
                      <h3 className="text-2xl font-display font-bold">{store.name}</h3>

                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {store.address}
                          {store.pincode ? `, ${store.pincode}` : ""}
                          <br />
                          {store.city}, {store.state}
                          <br />
                          <span className="text-xs italic">{store.landmark}</span>
                        </p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{store.hours}</p>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <a href="tel:+918595850920" className="text-sm text-primary hover:underline">
                          +91 8595850920
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {store.services.map((s) => (
                          <span
                            key={s}
                            className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <a href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full sm:w-auto border-border">
                            <NavigationIcon className="w-4 h-4 mr-2" />
                            Get Directions
                          </Button>
                        </a>
                        <Link href="/booking">
                          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                            Book a Session
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Recovery Unit */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-6 sm:p-10">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="bg-accent/10 w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0">
                      <Truck className="h-7 w-7 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                        Mobile Recovery Unit
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        Can&apos;t make it to the studio? Our Mobile Recovery Unit brings cold plunge, contrast
                        therapy, and recovery specialists directly to your marathon, sports day, or team
                        training camp — anywhere across Delhi NCR.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {["Delhi", "Greater Noida", "Noida", "Gurugram", "Ghaziabad", "Faridabad"].map((area) => (
                          <span
                            key={area}
                            className="text-xs font-medium bg-accent/10 text-accent px-3 py-1 rounded-full"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                      <Link href="/booking?tab=event">
                        <Button className="bg-accent hover:bg-accent/90 text-background font-semibold">
                          Book Mobile Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Expanding Soon</p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">More Studios On The Way</h2>
            <p className="text-lg text-muted-foreground mb-8">
              We&apos;re bringing CryoRevive studios closer to you across Delhi NCR.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {COMING_SOON_CITIES.map((city) => (
                <span
                  key={city}
                  className="text-sm font-medium border border-border bg-card px-4 py-2 rounded-sm text-muted-foreground"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
