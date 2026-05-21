import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Blog() {
  const articles = [
    {
      slug: "ice-bath-benefits-athletes",
      title: "The Science Behind Ice Baths: Why Elite Athletes Swear By Cold Therapy",
      excerpt: "Discover the physiological mechanisms that make ice bath therapy a game-changer for muscle recovery, inflammation reduction, and athletic performance enhancement.",
      image: "/Ice-Baths-Sydney-1.jpg",
      category: "Recovery Science",
      readTime: "8 min read",
      date: "2026-05-01",
      author: "Dr. Sarah Martinez"
    },
    {
      slug: "contrast-therapy-protocol",
      title: "Contrast Therapy Protocol: Maximizing Recovery with Hot-Cold Cycles",
      excerpt: "Learn the optimal temperature ranges, timing, and protocols for contrast therapy that professional athletes use to accelerate recovery and reduce soreness.",
      image: "/can-you-take-a-hot-shower-after-a-cold-plunge-510868.webp",
      category: "Training Tips",
      readTime: "6 min read",
      date: "2026-04-28",
      author: "Coach Marcus Chen"
    },
    {
      slug: "sauna-benefits-muscle-recovery",
      title: "Heat Therapy Benefits: How Saunas Improve Muscle Recovery",
      excerpt: "Explore the research on sauna therapy for muscle relaxation, detoxification, cardiovascular health, and its synergy with cold plunge protocols.",
      image: "/infrared_sauna_vs_traditional_sauna-1024x768.webp",
      category: "Recovery Science",
      readTime: "7 min read",
      date: "2026-04-25",
      author: "Dr. Priya Sharma"
    },
    {
      slug: "cold-plunge-mental-health",
      title: "Cold Plunge for Mental Health: Beyond Physical Recovery",
      excerpt: "Research shows ice baths offer powerful mental health benefits including stress reduction, improved mood, and enhanced mental resilience.",
      image: "/Cold-Plunge-for-Mental-Health_img.jpg",
      category: "Wellness",
      readTime: "5 min read",
      date: "2026-04-22",
      author: "Dr. Emma Wilson"
    },
    {
      slug: "athlete-recovery-timing",
      title: "When to Use Ice Baths: Optimal Timing for Maximum Recovery",
      excerpt: "Timing matters. Learn when to schedule your cold plunge sessions relative to training for the best results in inflammation control and recovery.",
      image: "/CoreChill-Lifestyle.webp",
      category: "Training Tips",
      readTime: "6 min read",
      date: "2026-04-18",
      author: "Coach David Thompson"
    },
    {
      slug: "contrast-therapy-vs-ice-bath",
      title: "Contrast Therapy vs Ice Bath: Which Recovery Method is Right for You?",
      excerpt: "Compare the benefits of pure cold immersion versus alternating hot-cold cycles to determine the best recovery protocol for your training goals.",
      image: "/image1-3.webp",
      category: "Recovery Science",
      readTime: "7 min read",
      date: "2026-04-15",
      author: "Dr. Sarah Martinez"
    }
  ];

  const categories = ["All", "Recovery Science", "Training Tips", "Wellness"];

  return (
    <>
      <SEO 
        title="Recovery Science Blog | CryoRevive - Ice Bath & Sauna Research"
        description="Learn about ice bath benefits, sauna therapy, contrast therapy protocols, and the latest recovery science for athletes and fitness enthusiasts."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Knowledge Base
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Recovery Science Blog
              </h1>
              <p className="text-lg text-muted-foreground">
                Expert insights on ice baths, sauna therapy, and science-backed recovery protocols for elite athletes.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category, index) => (
                <Badge
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  className={
                    index === 0
                      ? "bg-primary text-primary-foreground cursor-pointer px-6 py-2"
                      : "border-border text-muted-foreground hover:bg-card cursor-pointer px-6 py-2"
                  }
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <Card
                  key={index}
                  className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300"
                >
                  <div className="relative h-48 bg-muted overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary/90 text-primary-foreground font-semibold">
                        {article.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-bold leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{article.author}</span>
                      <Link
                        href={`/blog/${article.slug}`}
                        className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors group/link"
                      >
                        Read More
                        <ArrowRight className="ml-1 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to Apply This Knowledge?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience science-backed recovery protocols at CryoRevive. Book your session today.
            </p>
            <Link href="/booking" className="inline-block">
              <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors">
                Book Your Recovery Session
              </button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}