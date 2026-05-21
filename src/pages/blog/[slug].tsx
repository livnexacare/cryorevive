import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";

export default function BlogPost() {
  const article = {
    title: "The Science Behind Ice Baths: Why Elite Athletes Swear By Cold Therapy",
    excerpt: "Discover the physiological mechanisms that make ice bath therapy a game-changer for muscle recovery, inflammation reduction, and athletic performance enhancement.",
    image: "/Ice-Baths-Sydney-1.jpg",
    category: "Recovery Science",
    readTime: "8 min read",
    date: "2026-05-01",
    author: "Dr. Sarah Martinez",
    authorBio: "Sports Medicine Specialist & Recovery Research Lead"
  };

  return (
    <>
      <SEO 
        title={`${article.title} | CryoRevive Blog`}
        description={article.excerpt}
        image={article.image}
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/blog" className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>

            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary text-primary-foreground font-semibold">
                  {article.category}
                </Badge>

                <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
                  {article.title}
                </h1>

                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-display font-bold text-lg">
                      {article.author.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{article.author}</p>
                    <p className="text-sm text-muted-foreground">{article.authorBio}</p>
                  </div>
                </div>
              </div>

              <div className="relative h-96 rounded-sm overflow-hidden border border-border">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>

              <Card className="bg-card border-primary/30">
                <CardContent className="p-8 space-y-6 prose prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {article.excerpt}
                  </p>

                  <h2 className="text-2xl font-display font-bold text-foreground mt-8">
                    Understanding Cold Immersion
                  </h2>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    Ice bath therapy, also known as cold water immersion (CWI), involves submerging the body in water cooled to temperatures between -10°C and 15°C for controlled periods. This practice has become a cornerstone of elite athletic recovery protocols worldwide.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    The physiological response to cold immersion triggers a cascade of beneficial mechanisms that accelerate recovery, reduce inflammation, and enhance overall performance capacity.
                  </p>

                  <h2 className="text-2xl font-display font-bold text-foreground mt-8">
                    The Science of Vasoconstriction
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    When exposed to cold temperatures, blood vessels undergo vasoconstriction — a tightening response that reduces blood flow to peripheral tissues. This mechanism serves several critical recovery functions:
                  </p>

                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Reduced metabolic activity in affected tissues</li>
                    <li>Decreased inflammatory response at the cellular level</li>
                    <li>Minimized swelling and edema formation</li>
                    <li>Limited secondary tissue damage following intense exercise</li>
                  </ul>

                  <h2 className="text-2xl font-display font-bold text-foreground mt-8">
                    Inflammation Control and Recovery
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    Research demonstrates that ice bath therapy significantly reduces markers of muscle damage and inflammation. Studies show athletes who incorporate regular cold immersion experience:
                  </p>

                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Up to 60% reduction in delayed onset muscle soreness (DOMS)</li>
                    <li>Faster clearance of metabolic waste products</li>
                    <li>Reduced levels of inflammatory cytokines</li>
                    <li>Accelerated return to training intensity</li>
                  </ul>

                  <h2 className="text-2xl font-display font-bold text-foreground mt-8">
                    Optimal Protocol Guidelines
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    For maximum recovery benefits, elite athletes follow specific ice bath protocols:
                  </p>

                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li><strong>Temperature:</strong> -10°C to 4°C (optimal range for tissue response)</li>
                    <li><strong>Duration:</strong> 10-15 minutes (longer may reduce benefits)</li>
                    <li><strong>Timing:</strong> Within 1-2 hours post-training (immediate intervention)</li>
                    <li><strong>Frequency:</strong> 3-5 sessions per week depending on training load</li>
                  </ul>

                  <h2 className="text-2xl font-display font-bold text-foreground mt-8">
                    Conclusion
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    Ice bath therapy represents a powerful, science-backed tool for serious athletes seeking to optimize recovery and maintain peak performance. The physiological mechanisms are clear: controlled cold exposure reduces inflammation, accelerates tissue repair, and enables higher training volumes.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    At CryoRevive, we provide precision-controlled cold immersion protocols backed by the latest recovery research. Our facilities maintain exact temperature ranges and professional supervision to ensure you maximize the benefits of every session.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-8 text-center space-y-4">
                  <h3 className="text-2xl font-display font-bold">
                    Experience Science-Backed Recovery
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Ready to integrate ice bath therapy into your training protocol? Book a session at CryoRevive and experience elite athlete recovery.
                  </p>
                  <Link href="/booking">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      Book Your First Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </article>

        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Contrast Therapy Protocol: Hot-Cold Cycles",
                  category: "Training Tips",
                  image: "/can-you-take-a-hot-shower-after-a-cold-plunge-510868.webp"
                },
                {
                  title: "Heat Therapy Benefits for Recovery",
                  category: "Recovery Science",
                  image: "/infrared_sauna_vs_traditional_sauna-1024x768.webp"
                },
                {
                  title: "Cold Plunge Mental Health Benefits",
                  category: "Wellness",
                  image: "/Cold-Plunge-for-Mental-Health_img.jpg"
                }
              ].map((related, index) => (
                <Card key={index} className="bg-background border-border group hover:border-primary/50 transition-all">
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <Image src={related.image} alt={related.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/90 text-primary-foreground text-xs">
                        {related.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-display font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                      {related.title}
                    </h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}