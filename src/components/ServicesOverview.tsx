import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Snowflake, Droplets, Repeat, Truck } from "lucide-react";

export function ServicesOverview() {
  const services = [
    {
      icon: Snowflake,
      title: "Ice Bath Therapy",
      description: "Precision-controlled cold plunge at -10°C to 4°C. Reduce inflammation and accelerate muscle recovery.",
      duration: "3-15 min",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Droplets,
      title: "Steam Sauna",
      description: "High-heat therapy at 60-90°C for deep muscle relaxation, detoxification, and improved circulation.",
      duration: "15-20 min",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Repeat,
      title: "Contrast Therapy",
      description: "Alternate hot and cold cycles to maximize recovery. Elite protocol used by professional athletes.",
      duration: "30-45 min",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Truck,
      title: "Mobile Recovery",
      description: "On-site services for gyms, events, and teams. Bring elite recovery technology to your location.",
      duration: "Custom",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
            Recovery Solutions
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from our range of science-backed recovery therapies designed for peak performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="bg-card border-border hover:border-primary/50 transition-all duration-300 group"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`${service.bgColor} w-12 h-12 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="inline-block px-3 py-1 bg-muted rounded-sm">
                      <p className="text-xs font-semibold text-foreground">{service.duration}</p>
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