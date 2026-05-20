import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";
import Link from "next/link";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Marcus Chen",
      role: "Professional MMA Fighter",
      location: "Mumbai, India",
      image: "/ChatGPT_Image_May_16_2025_05_08_10_PM.png",
      rating: 5,
      quote: "CryoRevive cut my recovery time in half. The contrast therapy is a game-changer for my training schedule. I can train harder and recover faster than ever before.",
      recovery: "Ice Bath + Sauna",
      frequency: "5x per week"
    },
    {
      name: "Sarah Martinez",
      role: "CrossFit Athlete",
      location: "Bangalore, India",
      image: "/Cold-Plunge-for-Mental-Health_img.jpg",
      rating: 5,
      quote: "The ice baths here are next level. The temperature control is precise, and the staff knows exactly how to guide you through the protocol. I've seen huge improvements in my competition performance.",
      recovery: "Ice Bath Therapy",
      frequency: "3x per week"
    },
    {
      name: "David Thompson",
      role: "Bodybuilding Coach",
      location: "Delhi, India",
      image: "/Ice-Baths-Sydney-1.jpg",
      rating: 5,
      quote: "I recommend CryoRevive to all my clients. The science-backed approach and professional setup make it the best recovery facility around. My athletes recover faster and perform better.",
      recovery: "Contrast Therapy",
      frequency: "4x per week"
    },
    {
      name: "Priya Sharma",
      role: "Marathon Runner",
      location: "Pune, India",
      image: "/image1-3.webp",
      rating: 5,
      quote: "After long training runs, the ice bath therapy at CryoRevive is essential. The inflammation reduction is immediate and noticeable. I can maintain my training volume without breaking down.",
      recovery: "Ice Bath Sessions",
      frequency: "2x per week"
    },
    {
      name: "Rajesh Kumar",
      role: "Powerlifter",
      location: "Hyderabad, India",
      image: "/CoreChill-Lifestyle.webp",
      rating: 5,
      quote: "The mobile recovery unit came to our gym for a competition prep week. The convenience and quality were outstanding. My team's recovery metrics improved significantly.",
      recovery: "Mobile Unit Service",
      frequency: "Team sessions"
    },
    {
      name: "Emma Wilson",
      role: "Yoga Instructor & Athlete",
      location: "Goa, India",
      image: "/can-you-take-a-hot-shower-after-a-cold-plunge-510868.webp",
      rating: 5,
      quote: "The sauna sessions complement my yoga practice perfectly. The heat therapy helps with flexibility and mental clarity. CryoRevive has become an essential part of my wellness routine.",
      recovery: "Steam Sauna",
      frequency: "Daily"
    }
  ];

  const stats = [
    { value: "500+", label: "Athletes Served" },
    { value: "4.9/5", label: "Average Rating" },
    { value: "95%", label: "Client Retention" },
    { value: "2000+", label: "Sessions Completed" }
  ];

  return (
    <>
      <SEO 
        title="Athlete Testimonials & Reviews | CryoRevive Success Stories"
        description="Read what elite athletes, bodybuilders, and fitness professionals say about their recovery experience at CryoRevive."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Trusted By Elite Athletes
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Recovery Success Stories
              </h1>
              <p className="text-lg text-muted-foreground">
                See how CryoRevive is transforming athlete recovery and performance across India.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <p className="text-4xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-background border-border overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={testimonial.image}
                      alt={`${testimonial.name} recovery session`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-primary-foreground font-semibold">
                        Verified Athlete
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                        ))}
                      </div>
                      <Quote className="h-8 w-8 text-primary/20" />
                    </div>

                    <p className="text-foreground leading-relaxed italic">
                      &quot;{testimonial.quote}&quot;
                    </p>

                    <div className="pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="font-semibold text-foreground text-lg">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {testimonial.recovery}
                        </Badge>
                        <Badge variant="outline" className="border-accent/30 text-accent">
                          {testimonial.frequency}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to Experience Elite Recovery?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of athletes who trust CryoRevive for faster recovery and peak performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Book Your First Session
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-card font-semibold"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}