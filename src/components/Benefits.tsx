import { Activity, Flame, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Benefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Faster Recovery",
      description: "Reduce muscle soreness by up to 60% and get back to training sooner with accelerated tissue repair.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Activity,
      title: "Reduced Inflammation",
      description: "Cold therapy constricts blood vessels, reducing swelling and inflammation at the cellular level.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Flame,
      title: "Improved Performance",
      description: "Optimize your nervous system, boost circulation, and enhance mental clarity for peak athletic output.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold mb-3 md:mb-4">
            Science-Backed Benefits
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground">
            Trusted by elite athletes, bodybuilders, and fitness professionals worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="bg-background border-border hover:border-primary/50 transition-all duration-300"
              >
                <CardContent className="p-4 md:p-8 flex flex-row md:flex-col items-start gap-3 md:gap-0 md:space-y-4">
                  <div className={`${benefit.bgColor} w-10 h-10 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 md:h-7 md:w-7 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-2xl font-display font-bold mb-1">{benefit.title}</h3>
                    <p className="text-xs md:text-base text-gray-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}