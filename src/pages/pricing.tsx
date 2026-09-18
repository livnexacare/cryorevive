import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";
import { fetchLivePrices, type ServicePrice } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com";
const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "918595850920";

export interface MembershipPlan {
  plan_type: string;
  name: string;
  sessions_per_month: number;
  price: number;
  original_price?: number | null;
  is_active: boolean;
  is_featured: boolean;
}

const FALLBACK_PLANS: MembershipPlan[] = [
  { plan_type: "starter", name: "Starter", sessions_per_month: 8, price: 5999, original_price: 14999, is_active: true, is_featured: false },
  { plan_type: "athlete", name: "Athlete", sessions_per_month: 16, price: 9999, original_price: 24999, is_active: true, is_featured: true },
  { plan_type: "elite", name: "Elite", sessions_per_month: 30, price: 15999, original_price: 39999, is_active: true, is_featured: false },
];

const PLAN_BORDER_COLORS: Record<string, string> = {
  starter: "border-green-500/40",
  athlete: "border-cyan-500/60",
  elite: "border-purple-500/40",
};

export async function getServerSideProps() {
  const [prices, plans] = await Promise.all([
    fetchLivePrices(),
    fetch(`${API_URL}/api/membership-plans`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []) as Promise<MembershipPlan[]>,
  ]);
  return { props: { prices, plans } };
}

const SERVICE_IMAGES: Record<string, string> = {
  ice_bath: "/ice-bath-therapy.png",
  steam_sauna: "/steam-sauna.png",
  contrast_therapy: "/contrast-therapy.png",
  compression_therapy: "/compression-therapy.png",
  deep_tissue_massage: "/deep-tissue-therapy.png",
  cupping_therapy: "/cupping-thrapy.png",
  physiotherapy: "/physiotherapy.png",
  full_body_recovery: "/full-body.png",
  kneeva: "/kneeva.png",
};

const SERVICE_GRADIENTS: Record<string, string> = {
  ice_bath: "from-blue-900 to-cyan-800",
  steam_sauna: "from-orange-900 to-amber-800",
  contrast_therapy: "from-cyan-900 to-blue-800",
  compression_therapy: "from-purple-900 to-violet-800",
  deep_tissue_massage: "from-green-900 to-emerald-800",
  cupping_therapy: "from-red-900 to-orange-800",
  physiotherapy: "from-teal-900 to-cyan-800",
  full_body_recovery: "from-blue-900 to-cyan-700",
  kneeva: "from-blue-900 to-indigo-800",
};

export default function Pricing({ prices = [], plans = [] }: { prices: ServicePrice[]; plans: MembershipPlan[] }) {
  const membershipPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  const getPrice = (serviceType: string, fallback: string): string => {
    const live = prices.find((p) => p.service_type === serviceType && p.is_active);
    return live ? `₹${live.price.toLocaleString("en-IN")}` : fallback;
  };

  const getDiscount = (serviceType: string) => {
    const live = prices.find((p) => p.service_type === serviceType && p.is_active);
    if (!live || !live.discounted_price || live.discounted_price >= (live.original_price ?? live.price)) {
      return null;
    }
    const original = live.original_price ?? live.price;
    const percent = live.discount_percent ?? Math.round((1 - live.discounted_price / original) * 100);
    return {
      original: `₹${original.toLocaleString("en-IN")}`,
      percent,
      label: live.discount_label || null,
      featured: !!live.is_featured,
    };
  };

  const isFeatured = (serviceType: string): boolean => {
    const live = prices.find((p) => p.service_type === serviceType && p.is_active);
    return !!live?.is_featured;
  };

  const hasAnyDiscount = prices.some(
    (p) => p.is_active && p.discounted_price && p.discounted_price < (p.original_price ?? p.price)
  );

  const singleSessions: {
    title: string;
    serviceType: string;
    price: string;
    duration: string;
    description: string;
    features: string[];
    isNew?: boolean;
  }[] = [
    {
      title: "Ice Bath Session",
      serviceType: "ice_bath",
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
      serviceType: "steam_sauna",
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
      serviceType: "contrast_therapy",
      price: getPrice("contrast_therapy", "₹1,999"),
      duration: "45 minutes",
      description: "Complete hot-cold cycle protocol",
      features: [
        "Guided contrast cycles",
        "Ice bath + sauna combo",
        "Elite recovery protocol",
        "Full facility access"
      ]
    },
    {
      title: "Compression Therapy",
      serviceType: "compression_therapy",
      price: getPrice("compression_therapy", "₹999"),
      duration: "30 minutes",
      description: "Improve circulation and reduce muscle soreness",
      features: [
        "Air compression therapy",
        "Leg & full body options",
        "Reduces swelling and inflammation",
        "Recovery boost"
      ]
    },
    {
      title: "Full Body Recovery",
      serviceType: "full_body_recovery",
      price: getPrice("full_body_recovery", "₹2,999"),
      duration: "60 minutes",
      description: "Complete recovery experience for your body and mind",
      features: [
        "Cold plunge",
        "Compression therapy",
        "Massage gun",
        "Recovery guidance"
      ]
    },
    {
      title: "Cupping Therapy",
      serviceType: "cupping_therapy",
      price: getPrice("cupping_therapy", "₹799"),
      duration: "30 minutes",
      description: "Traditional cupping therapy to release muscle tension and improve blood flow",
      features: [
        "Traditional cupping technique",
        "Releases muscle tension",
        "Improves circulation",
        "Reduces inflammation"
      ]
    },
    {
      title: "Deep Tissue Massage",
      serviceType: "deep_tissue_massage",
      price: getPrice("deep_tissue_massage", "₹799"),
      duration: "45 minutes",
      description: "Deep pressure massage targeting deeper muscle layers for pain relief and recovery",
      features: [
        "Deep pressure technique",
        "Relieves muscle tension",
        "Improves mobility",
        "Enhances performance"
      ]
    },
    {
      title: "Physiotherapy",
      serviceType: "physiotherapy",
      price: getPrice("physiotherapy", "₹1,999"),
      duration: "60 minutes",
      description: "Professional physiotherapy for injury recovery, rehabilitation and performance optimization",
      features: [
        "Certified physiotherapist",
        "Injury rehabilitation",
        "Pain management",
        "Posture correction"
      ]
    },
    {
      title: "Kneeva — Knee & Shoulder Recovery",
      serviceType: "kneeva",
      price: getPrice("kneeva", "₹799"),
      duration: "20 minutes",
      description: "Recovery wrap combining massage therapy, red light therapy, and 4 customisable therapy modes for knee and shoulder pain relief",
      features: [
        "Massage therapy",
        "Red light therapy",
        "4 therapy modes",
        "Lightweight & portable"
      ],
      isNew: true
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
        url="/pricing"
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

        {hasAnyDiscount && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-4">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-white font-display font-bold text-lg sm:text-xl">
                  🔥 Limited Time Offer
                </p>
                <p className="text-red-100 text-sm">
                  Special launch prices on select sessions — book before the offer ends
                </p>
              </div>
              <Link href="/booking">
                <Button className="bg-white text-red-600 hover:bg-red-50 font-bold whitespace-nowrap">
                  Book Now →
                </Button>
              </Link>
            </div>
          </section>
        )}

        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold">
                  Single Sessions
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Pay per visit — no commitment
                </p>
              </div>
              {hasAnyDiscount && (
                <span className="text-red-500 text-sm font-bold animate-pulse">
                  🔥 Launch Offers Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {singleSessions.map((session, index) => {
                const discount = getDiscount(session.serviceType);
                const featured = isFeatured(session.serviceType);
                const gradient = SERVICE_GRADIENTS[session.serviceType] ?? "from-gray-800 to-gray-700";
                const imgSrc = SERVICE_IMAGES[session.serviceType];
                return (
                  <Link
                    key={index}
                    href={`/booking?service=${session.serviceType}`}
                    className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-[1.02] hover:shadow-xl block"
                  >
                    {discount && (
                      <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg">
                        {discount.percent}% OFF
                      </div>
                    )}
                    {featured && !discount && (
                      <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        ⭐ Popular
                      </div>
                    )}
                    {session.isNew && (
                      <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        NEW
                      </div>
                    )}

                    <div className={`relative h-44 bg-gradient-to-br ${gradient}`}>
                      {imgSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={session.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-sm leading-tight mb-1">{session.title}</h3>
                      <p className="text-muted-foreground text-xs mb-3">{session.duration}</p>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-black text-xl text-primary">{session.price}</p>
                          {discount && (
                            <p className="text-muted-foreground text-xs line-through">{discount.original}</p>
                          )}
                          {discount?.label && (
                            <p className="text-red-500 text-xs font-bold">{discount.label}</p>
                          )}
                        </div>
                        <div className="w-8 h-8 bg-primary group-hover:bg-primary/90 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                          <span className="text-primary-foreground text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <Link href="/booking">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Book Any Session →
                </Button>
              </Link>
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
              {membershipPlans.map((plan) => {
                const original = plan.original_price ?? plan.price;
                const saved = original - plan.price;
                return (
                  <Card
                    key={plan.plan_type}
                    className={`relative bg-background ${PLAN_BORDER_COLORS[plan.plan_type] ?? "border-border"} ${plan.is_featured ? "border-2" : ""}`}
                  >
                    {plan.is_featured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground font-semibold px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="space-y-4 pb-6">
                      <h3 className="text-2xl font-display font-bold uppercase">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm">{plan.sessions_per_month} sessions / month</p>
                      <div>
                        <div className="flex items-baseline">
                          <p className="text-4xl font-display font-bold">₹{plan.price.toLocaleString("en-IN")}</p>
                          <p className="text-muted-foreground ml-2">/month</p>
                        </div>
                        {original > plan.price && (
                          <>
                            <p className="text-muted-foreground text-sm line-through">₹{original.toLocaleString("en-IN")}</p>
                            {saved > 0 && (
                              <p className="text-green-600 text-xs font-bold">Save ₹{saved.toLocaleString("en-IN")}/month</p>
                            )}
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(
                          `Hi! I want the ${plan.name} membership (${plan.sessions_per_month} sessions/month) at CryoRevive.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button
                          className={`w-full font-semibold ${
                            plan.is_featured
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                              : "bg-accent hover:bg-accent/90 text-accent-foreground"
                          }`}
                        >
                          Get {plan.name} Plan
                        </Button>
                      </a>
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