import Image from "next/image";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Snowflake, Droplets, Repeat, Truck, Activity, Sparkles, Clock, Thermometer, CheckCircle, Droplet, Hand, Stethoscope } from "lucide-react";
import Link from "next/link";

const COLOR_STYLES: Record<string, { border: string; button: string }> = {
  "text-primary": { border: "border-primary/30", button: "bg-primary hover:bg-primary/90 text-background" },
  "text-accent": { border: "border-accent/30", button: "bg-accent hover:bg-accent/90 text-background" },
  "text-orange-400": { border: "border-orange-500/30", button: "bg-orange-500 hover:bg-orange-600 text-white" },
  "text-blue-400": { border: "border-blue-500/30", button: "bg-blue-500 hover:bg-blue-600 text-white" },
  "text-green-400": { border: "border-green-500/30", button: "bg-green-500 hover:bg-green-600 text-white" },
};

export default function Services() {
  const router = useRouter();

  const services = [
    {
      icon: Snowflake,
      title: "Ice Bath Therapy",
      tagline: "Precision Cold Immersion",
      description: "Clinical-grade cold plunge therapy designed to reduce inflammation, accelerate muscle recovery, and enhance athletic performance through controlled cold exposure.",
      statLabel: "Temperature",
      statValue: "-10°C to 4°C",
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
      image: "/ice-bath-therapy.png"
    },
    {
      icon: Droplets,
      title: "Steam Sauna",
      tagline: "High-Heat Muscle Therapy",
      description: "Premium steam sauna sessions using controlled high-heat therapy to promote deep muscle relaxation, detoxification, and cardiovascular conditioning.",
      statLabel: "Temperature",
      statValue: "60-90°C",
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
      image: "/steam-sauna.png"
    },
    {
      icon: Repeat,
      title: "Contrast Therapy",
      tagline: "Elite Recovery Protocol",
      description: "Advanced alternating hot-cold cycles combining ice bath and sauna therapy. The protocol used by professional athletes for maximum recovery optimization.",
      statLabel: "Temperature",
      statValue: "Variable cycles",
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
      image: "/contrast-therapy.png"
    },
    {
      icon: Activity,
      title: "Compression Therapy",
      tagline: "Circulation Recovery",
      description: "Advanced pneumatic compression technology that systematically squeezes and releases to improve blood circulation, flush out lactic acid, and accelerate muscle recovery after intense training.",
      statLabel: "Technology",
      statValue: "Pneumatic Air",
      duration: "30 minutes",
      color: "text-primary",
      bgColor: "bg-primary/10",
      serviceType: "compression_therapy",
      benefits: [
        "Air compression therapy for deep recovery",
        "Leg and full body coverage options",
        "Reduces swelling and inflammation",
        "Improves lymphatic drainage",
        "Accelerates post-workout recovery"
      ],
      image: "/compression-therapy.png"
    },
    {
      icon: Sparkles,
      title: "Full Body Recovery",
      tagline: "Complete Recovery Protocol",
      description: "The ultimate 60-minute recovery experience combining cold plunge, compression therapy, and massage gun treatment — designed for athletes who demand peak performance and complete muscle restoration.",
      statLabel: "Modalities",
      statValue: "4-in-1 Protocol",
      duration: "60 minutes",
      color: "text-accent",
      bgColor: "bg-accent/10",
      serviceType: "full_body_recovery",
      benefits: [
        "Cold plunge therapy included",
        "Compression therapy included",
        "Massage gun recovery treatment",
        "Expert recovery guidance",
        "Complete athlete restoration protocol"
      ],
      image: "/full-body.png"
    },
    {
      icon: Droplet,
      title: "Cupping Therapy",
      tagline: "Traditional Recovery Therapy",
      description: "Traditional cupping therapy that uses suction to release muscle tension, improve blood flow, and accelerate recovery through time-tested therapeutic technique.",
      statLabel: "Method",
      statValue: "Traditional Cupping",
      duration: "30 minutes",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      serviceType: "cupping_therapy",
      benefits: [
        "Releases deep muscle tension",
        "Improves blood circulation",
        "Reduces inflammation",
        "Detoxifies the body",
        "Accelerates post-workout recovery"
      ],
      image: "/cupping-thrapy.png",
      imageSide: "right" as const,
    },
    {
      icon: Hand,
      title: "Deep Tissue Massage",
      tagline: "Therapeutic Massage",
      description: "Deep pressure massage targeting deeper muscle layers and connective tissue for lasting pain relief, improved mobility, and faster recovery.",
      statLabel: "Pressure",
      statValue: "Deep Tissue",
      duration: "45 minutes",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      serviceType: "deep_tissue_massage",
      benefits: [
        "Relieves deep muscle tension",
        "Reduces pain & soreness",
        "Improves mobility & flexibility",
        "Enhances athletic performance",
        "Reduces stress and anxiety"
      ],
      image: "/deep-tissue-therapy.png",
      imageSide: "left" as const,
    },
    {
      icon: Stethoscope,
      title: "Physiotherapy",
      tagline: "Professional Rehabilitation",
      description: "Professional physiotherapy for injury recovery, rehabilitation and performance optimization, guided by certified practitioners.",
      statLabel: "Care",
      statValue: "Clinical Rehab",
      duration: "60 minutes",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      serviceType: "physiotherapy",
      benefits: [
        "Injury rehabilitation",
        "Chronic pain management",
        "Improved mobility & range of motion",
        "Posture correction",
        "Performance enhancement"
      ],
      image: null,
      imageSide: "right" as const,
    },
    {
      icon: Truck,
      title: "Mobile Recovery Unit",
      tagline: "On-Site Elite Services",
      description: "Bring CryoRevive's elite recovery technology to your gym, event, or team facility. Complete mobile setup with professional supervision.",
      statLabel: "Temperature",
      statValue: "Full range",
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

  const handleBookService = (serviceType: string) => {
    router.push(`/booking?service=${serviceType}`);
  };

  return (
    <>
      <SEO 
        title="Recovery Services | Ice Bath, Sauna & Contrast Therapy - CryoRevive"
        description="Professional cold plunge, steam sauna, contrast therapy, and mobile recovery services for athletes. Science-backed protocols for peak performance."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-10 md:py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/30 rounded-sm mb-4 md:mb-6">
                <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">
                  Professional Recovery Solutions
                </p>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
                Elite Recovery Services
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground">
                Science-backed therapy protocols designed for athletes who demand peak performance and faster recovery.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              const isEven = "imageSide" in service
                ? service.imageSide === "left"
                : index % 2 === 0;
              const colorStyle = COLOR_STYLES[service.color] ?? COLOR_STYLES["text-accent"];

              return (
                <div key={index} className={`${index !== services.length - 1 ? 'mb-8 pb-8 border-b border-white/5 md:mb-20 md:pb-0 md:border-0' : ''}`}>
                  <div className={`grid lg:grid-cols-2 gap-5 md:gap-12 items-center`}>
                    <div className={`relative aspect-video md:aspect-auto md:h-[400px] rounded-2xl overflow-hidden border ${colorStyle.border} ${isEven ? 'order-1' : 'order-1 lg:order-2'}`}>
                      {service.image ? (
                        <Image
                          src={service.image}
                          alt={service.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          quality={95}
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/40 to-cyan-900/40">
                          <div className="text-center">
                            <Icon className={`h-16 w-16 mx-auto ${service.color}`} />
                            <p className="text-gray-400 text-sm mt-3">Photo coming soon</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`space-y-4 md:space-y-6 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                      <div className={`${service.bgColor} w-10 h-10 md:w-16 md:h-16 rounded-xl flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 md:h-8 md:w-8 ${service.color}`} />
                      </div>

                      <div>
                        <p className={`text-xs md:text-sm font-semibold ${service.color} uppercase tracking-widest mb-1 md:mb-2`}>
                          {service.tagline}
                        </p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black mb-2 md:mb-4">
                          {service.title}
                        </h2>
                        <p className="text-sm md:text-lg text-gray-400 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="flex gap-4 md:gap-6 py-2 md:py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className={`h-4 w-4 ${service.color}`} />
                            <span className="text-xs md:text-sm text-muted-foreground">{service.statLabel}</span>
                          </div>
                          <p className="text-sm md:text-xl font-display font-bold">{service.statValue}</p>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-4 w-4 ${service.color}`} />
                            <span className="text-xs md:text-sm text-muted-foreground">Duration</span>
                          </div>
                          <p className="text-sm md:text-xl font-display font-bold">{service.duration}</p>
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <h3 className="text-sm md:text-xl font-display font-bold">Key Benefits</h3>
                        {service.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start space-x-2 md:space-x-3">
                            <CheckCircle className={`h-4 w-4 md:h-5 md:w-5 ${service.color} flex-shrink-0 mt-0.5`} />
                            <p className="text-sm text-muted-foreground">{benefit}</p>
                          </div>
                        ))}
                      </div>

                      {service.serviceType ? (
                        <Button
                          size="lg"
                          onClick={() => handleBookService(service.serviceType)}
                          className={`w-full md:w-auto py-3 text-sm rounded-xl ${colorStyle.button} font-semibold mt-4`}
                        >
                          Book {service.title}
                        </Button>
                      ) : (
                        <Link href="/booking?tab=event" className="block md:inline-block">
                          <Button
                            size="lg"
                            className="w-full md:w-auto py-3 text-sm rounded-xl bg-accent hover:bg-accent/90 text-background font-semibold mt-4"
                          >
                            Book Mobile Event
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-10 md:py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 md:mb-6">
              Ready To Optimize Your Recovery?
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8">
              Book your first session and experience the difference elite recovery makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/booking" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto py-3 text-sm rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Book Your Session
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto py-3 text-sm rounded-xl border-border hover:bg-background font-semibold"
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