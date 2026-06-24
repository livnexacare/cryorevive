import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { fetchLivePrices, type ServicePrice } from "@/lib/pricing";

export async function getServerSideProps() {
  const prices = await fetchLivePrices();
  return { props: { prices } };
}

export default function Pricing({ prices = [] }: { prices: ServicePrice[] }) {
  const getPrice = (serviceType: string, fallback: string): string => {
    const live = prices.find((p) => p.service_type === serviceType && p.is_active);
    return live ? `₹${live.price.toLocaleString("en-IN")}` : fallback;
  };

  const singleSessions = [
    {
      title: "Ice Bath Session",
      price: getPrice("ice_bath", "₹899"),
      duration: "15 minutes",
      description: "Single cold plunge therapy session",
      features: [
        "Professional supervision",
        "Temperature-controlled ice bath",
        "Recovery guidance",
        "Post-session refreshments"
      ]
    },
    {
      title: "Steam Sauna Session",
      price: getPrice("steam_sauna", "₹999"),
      duration: "20 minutes",
      description: "Single high-heat sauna session",
      features: [
        "Premium steam room",
        "Towel and amenities provided",
        "Hydration station",
        "Relaxation area access"
      ]
    },
    {
      title: "Contrast Therapy",
      price: getPrice("contrast_therapy", "₹1,999"),
      duration: "45 minutes",
      description: "Complete hot-cold cycle protocol",
      features: [
        "Guided contrast cycles",
        "Ice bath + sauna combo",
        "Elite recovery protocol",
        "Full facility access"
      ]
    }
  ];

  const memberships = [
    {
      name: "Starter",
      icon: Zap,
      price: "₹5,999",
      period: "/month",
      description: "Perfect for getting started with recovery therapy",
      features: [
        "8 sessions per month",
        "Ice bath or sauna access",
        "Flexible scheduling",
        "10% retail discount",
        "Mobile app access"
      ],
      popular: false,
      color: "border-border"
    },
    {
      name: "Athlete",
      icon: Trophy,
      price: "₹9,999",
      period: "/month",
      description: "Designed for serious athletes in training",
      features: [
        "16 sessions per month",
        "Ice bath + sauna access",
        "Priority booking",
        "15% retail discount",
        "Recovery tracking app",
        "Guest pass (2/month)"
      ],
      popular: true,
      color: "border-primary"
    },
    {
      name: "Elite",
      icon: Users,
      price: "₹15,999",
      period: "/month",
      description: "Ultimate recovery for peak performers",
      features: [
        "Unlimited sessions",
        "All recovery modalities",
        "Anytime access (6 AM - 10 PM)",
        "20% retail discount",
        "Personal recovery plan",
        "Guest passes (4/month)",
        "Mobile unit priority"
      ],
      popular: false,
      color: "border-accent"
    }
  ];

  const athletePackages = [
    {
      title: "Team Recovery Package",
      price: "Custom pricing",
      description: "On-site mobile recovery for sports teams and gyms",
      features: [
        "Mobile ice bath + sauna setup",
        "Professional supervision included",
        "Minimum 10 athletes",
        "Custom session scheduling",
        "Team performance tracking"
      ]
    },
    {
      title: "Competition Prep",
      price: "₹24,999",
      duration: "4 weeks",
      description: "Intensive recovery program for pre-competition athletes",
      features: [
        "24 guided sessions",
        "Personalized recovery protocol",
        "Performance tracking",
        "Nutrition guidance",
        "Priority scheduling"
      ]
    }
  ];

  return (
    <>
      <SEO 
        title="Pricing & Memberships | Recovery Plans - CryoRevive"
        description="Flexible pricing for ice bath, sauna, and contrast therapy. Single sessions, monthly memberships, and athlete packages available."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Flexible Recovery Plans
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Pricing & Memberships
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose the plan that fits your training schedule and recovery needs.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Single Sessions
              </h2>
              <p className="text-muted-foreground">
                Pay per session — perfect for trying our services
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {singleSessions.map((session, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardHeader className="space-y-4 pb-6">
                    <h3 className="text-2xl font-display font-bold">{session.title}</h3>
                    <div>
                      <p className="text-4xl font-display font-bold text-primary">{session.price}</p>
                      <p className="text-sm text-muted-foreground mt-1">{session.duration}</p>
                    </div>
                    <p className="text-muted-foreground">{session.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {session.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/booking" className="block">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Monthly Memberships
              </h2>
              <p className="text-muted-foreground">
                Save up to 35% with unlimited recovery access
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {memberships.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card 
                    key={index} 
                    className={`bg-background ${plan.color} ${plan.popular ? 'border-2 relative' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground font-semibold px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="space-y-4 pb-6">
                      <div className={`${plan.popular ? 'bg-primary/10' : 'bg-muted'} w-14 h-14 rounded-sm flex items-center justify-center`}>
                        <Icon className={`h-7 w-7 ${plan.popular ? 'text-primary' : 'text-foreground'}`} />
                      </div>
                      <h3 className="text-2xl font-display font-bold">{plan.name}</h3>
                      <div>
                        <div className="flex items-baseline">
                          <p className="text-4xl font-display font-bold">{plan.price}</p>
                          <p className="text-muted-foreground ml-2">{plan.period}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <Check className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-accent'} flex-shrink-0 mt-0.5`} />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/booking" className="block">
                        <Button 
                          className={`w-full font-semibold ${
                            plan.popular 
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                              : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                          }`}
                        >
                          Start {plan.name}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Athlete Packages
              </h2>
              <p className="text-muted-foreground">
                Specialized programs for teams and competitive athletes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {athletePackages.map((pkg, index) => (
                <Card key={index} className="bg-card border-accent/30">
                  <CardHeader className="space-y-4">
                    <h3 className="text-2xl font-display font-bold">{pkg.title}</h3>
                    <div>
                      <p className="text-3xl font-display font-bold text-accent">{pkg.price}</p>
                      {pkg.duration && (
                        <p className="text-sm text-muted-foreground mt-1">{pkg.duration}</p>
                      )}
                    </div>
                    <p className="text-muted-foreground">{pkg.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="block">
                      <Button 
                        variant="outline"
                        className="w-full border-accent text-accent hover:bg-accent/10 font-semibold"
                      >
                        Contact For Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Not Sure Which Plan?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book a free consultation to discuss your recovery goals and find the perfect plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Schedule Consultation
                </Button>
              </Link>
              <Link href="/booking">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-background font-semibold"
                >
                  Try Single Session
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