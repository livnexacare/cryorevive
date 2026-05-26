import Image from "next/image";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Snowflake, Droplets, Repeat, Truck, Clock, Thermometer, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Services() {
  const router = useRouter();

  const services = [
    {
      icon: Snowflake,
      title: "Ice Bath Therapy",
      tagline: "Precision Cold Immersion",
      description: "Clinical-grade cold plunge therapy designed to reduce inflammation, accelerate muscle recovery, and enhance athletic performance through controlled cold exposure.",
      temperature: "-10°C to 4°C",
      duration: "3-15 minutes",
      color: "text-primary",
      bgColor: "bg-primary/10",
      serviceType: "ice_bath",
      benefits: [
        "Reduces muscle soreness by up to 60%",
        "Decreases inflammation at cellular level",
        "Accelerates post-workout recovery",
        "Boosts circulation and immune function",
        "Enhances mental clarity and focus"
      ],
      image: "/Ice Bath Therapy.png"
    },
    {
      icon: Droplets,
      title: "Steam Sauna",
      tagline: "High-Heat Muscle Therapy",
      description: "Premium steam sauna sessions using controlled high-heat therapy to promote deep muscle relaxation, detoxification, and cardiovascular conditioning.",
      temperature: "60-90°C",
      duration: "15-20 minutes",
      color: "text-accent",
      bgColor: "bg-accent/10",
      serviceType: "steam_sauna",
      benefits: [
        "Deep muscle relaxation and tension relief",
        "Detoxification through increased sweating",
        "Improved circulation and blood flow",
        "Enhanced cardiovascular conditioning",
        "Stress reduction and mental relaxation"
      ],
      image: "/Steam Sauna.png"
    },
    {
      icon: Repeat,
      title: "Contrast Therapy",
      tagline: "Elite Recovery Protocol",
      description: "Advanced alternating hot-cold cycles combining ice bath and sauna therapy. The protocol used by professional athletes for maximum recovery optimization.",
      temperature: "Variable cycles",
      duration: "30-45 minutes",
      color: "text-primary",
      bgColor: "bg-primary/10",
      serviceType: "contrast_therapy",
      benefits: [
        "Maximizes recovery through contrast cycles",
        "Reduces inflammation more effectively",
        "Improves circulation and lymphatic drainage",
        "Accelerates metabolic waste removal",
        "Elite-level recovery optimization"
      ],
      image: "/Contrast Therapy.png"
    },
    {
      icon: Truck,
      title: "Mobile Recovery Unit",
      tagline: "On-Site Elite Services",
      description: "Bring CryoRevive's elite recovery technology to your gym, event, or team facility. Complete mobile setup with professional supervision.",
      temperature: "Full range",
      duration: "Custom sessions",
      color: "text-accent",
      bgColor: "bg-accent/10",
      serviceType: null,
      benefits: [
        "Professional on-site setup and supervision",
        "Full ice bath and sauna equipment",
        "Perfect for gyms, events, and sports teams",
        "Custom session scheduling",
        "Complete safety and monitoring"
      ],
      image: "/Mobile%20recovery%20unit.png"
    }
  ];

  const handleBookService = (serviceType: string | null) => {
    if (serviceType) router.push(`/booking?service=${serviceType}`);
  };

  return (
    <>
      <SEO 
        title="Recovery Services | Ice Bath, Sauna & Contrast Therapy - CryoRevive"
        description="Professional cold plunge, steam sauna, contrast therapy, and mobile recovery services for athletes. Science-backed protocols for peak performance."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Professional Recovery Solutions
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Elite Recovery Services
              </h1>
              <p className="text-lg text-muted-foreground">
                Science-backed therapy protocols designed for athletes who demand peak performance and faster recovery.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${index !== services.length - 1 ? 'mb-20' : ''}`}>
                  <div className={`relative h-[400px] rounded-sm overflow-hidden border ${service.color === 'text-primary' ? 'border-primary/30' : 'border-accent/30'} ${isEven ? 'order-1' : 'order-2 lg:order-2'}`}>
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className={`absolute inset-0 ${service.color === 'text-primary' ? 'bg-primary/20' : 'bg-accent/20'}`}></div>
                  </div>

                  <div className={`space-y-6 ${isEven ? 'order-2' : 'order-1 lg:order-1'}`}>
                    <div className={`${service.bgColor} w-16 h-16 rounded-sm flex items-center justify-center`}>
                      <Icon className={`h-8 w-8 ${service.color}`} />
                    </div>
                    
                    <div>
                      <p className={`text-sm font-semibold ${service.color} uppercase tracking-wider mb-2`}>
                        {service.tagline}
                      </p>
                      <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                        {service.title}
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex gap-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Thermometer className={`h-5 w-5 ${service.color}`} />
                          <span className="text-sm text-muted-foreground">Temperature</span>
                        </div>
                        <p className="text-xl font-display font-bold">{service.temperature}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className={`h-5 w-5 ${service.color}`} />
                          <span className="text-sm text-muted-foreground">Duration</span>
                        </div>
                        <p className="text-xl font-display font-bold">{service.duration}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <h3 className="text-xl font-display font-bold">Key Benefits</h3>
                      {service.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <CheckCircle className={`h-5 w-5 ${service.color} flex-shrink-0 mt-0.5`} />
                          <p className="text-muted-foreground">{benefit}</p>
                        </div>
                      ))}
                    </div>

                    {service.serviceType ? (
                      <Button
                        size="lg"
                        onClick={() => handleBookService(service.serviceType)}
                        className={`${service.color === 'text-primary' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'} text-background font-semibold mt-6`}
                      >
                        Book {service.title}
                      </Button>
                    ) : (
                      <Link href="/booking?tab=event">
                        <Button
                          size="lg"
                          className="bg-accent hover:bg-accent/90 text-background font-semibold mt-6"
                        >
                          Book Mobile Event
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready To Optimize Your Recovery?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book your first session and experience the difference elite recovery makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Book Your Session
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-background font-semibold"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}