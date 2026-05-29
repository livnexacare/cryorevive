import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Snowflake, Droplets, Repeat, Truck } from "lucide-react";
import type { ServicePrice } from "@/lib/pricing";

const STATIC_SERVICES = [
  {
    icon: Snowflake,
    title: "Ice Bath Therapy",
    description: "Precision-controlled cold plunge at -10°C to 4°C. Reduce inflammation and accelerate muscle recovery.",
    duration: "3-15 min",
    service_type: "ice_bath",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Droplets,
    title: "Steam Sauna",
    description: "High-heat therapy at 60-90°C for deep muscle relaxation, detoxification, and improved circulation.",
    duration: "15-20 min",
    service_type: "steam_sauna",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Repeat,
    title: "Contrast Therapy",
    description: "Alternate hot and cold cycles to maximize recovery. Elite protocol used by professional athletes.",
    duration: "30-45 min",
    service_type: "contrast_therapy",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "Mobile Recovery",
    description: "On-site services for gyms, events, and teams. Bring elite recovery technology to your location.",
    duration: "Custom",
    service_type: "mobile_unit",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

interface Props {
  prices?: ServicePrice[];
}

export function ServicesOverview({ prices = [] }: Props) {
  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold mb-3 md:mb-4">
            Recovery Solutions
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground">
            Choose from our range of science-backed recovery therapies designed for peak performance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {STATIC_SERVICES.map((service, index) => {
            const Icon = service.icon;
            const livePrice = prices.find((p) => p.service_type === service.service_type && p.is_active);
            return (
              <Card
                key={index}
                className="bg-card border-border hover:border-primary/50 transition-all duration-300 group"
              >
                <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className={`${service.bgColor} w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4 w-4 md:h-6 md:w-6 ${service.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-xl font-display font-bold mb-1 md:mb-2">{service.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-muted rounded-sm">
                        <p className="text-xs font-semibold text-foreground">
                          {livePrice ? livePrice.duration : service.duration}
                        </p>
                      </div>
                      {livePrice && (
                        <p className="text-xs md:text-sm font-bold text-primary">
                          ₹{livePrice.price.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/services">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 font-semibold"
            >
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
