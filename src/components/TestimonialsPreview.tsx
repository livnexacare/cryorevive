import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TestimonialsPreview() {
  const testimonials = [
    {
      name: "Marcus Chen",
      role: "Professional MMA Fighter",
      quote: "CryoRevive cut my recovery time in half. The contrast therapy is a game-changer for my training schedule.",
      rating: 5,
    },
    {
      name: "Sarah Martinez",
      role: "CrossFit Athlete",
      quote: "The ice baths here are next level. I can feel the difference in my performance and my body recovers faster than ever.",
      rating: 5,
    },
    {
      name: "David Thompson",
      role: "Bodybuilding Coach",
      quote: "I recommend CryoRevive to all my clients. The science-backed approach and professional setup make it the best recovery facility around.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
            Trusted By Athletes
          </h2>
          <p className="text-lg text-muted-foreground">
            See what elite performers are saying about their recovery experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-background border-border"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/testimonials">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 font-semibold"
            >
              Read More Stories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}