import Image from "next/image";
import { GetServerSideProps } from "next";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

const FALLBACK_ARTICLES: Record<string, ArticleProps> = {
  "ice-bath-benefits-athletes": {
    slug: "ice-bath-benefits-athletes",
    title: "The Science Behind Ice Baths: Why Elite Athletes Swear By Cold Therapy",
    excerpt: "Discover the physiological mechanisms that make ice bath therapy a game-changer for muscle recovery, inflammation reduction, and athletic performance enhancement.",
    content: null,
    image: "/Ice-Baths-Sydney-1.jpg",
    category: "Recovery Science",
    readTime: "8 min read",
    date: "2026-05-01",
    author: "Dr. Sarah Martinez",
    authorBio: "Sports Medicine Specialist & Recovery Research Lead",
  },
  "contrast-therapy-protocol": {
    slug: "contrast-therapy-protocol",
    title: "Contrast Therapy Protocol: Maximizing Recovery with Hot-Cold Cycles",
    excerpt: "Learn the optimal temperature ranges, timing, and protocols for contrast therapy that professional athletes use to accelerate recovery and reduce soreness.",
    content: null,
    image: "/can-you-take-a-hot-shower-after-a-cold-plunge-510868.webp",
    category: "Training Tips",
    readTime: "6 min read",
    date: "2026-04-28",
    author: "Coach Marcus Chen",
    authorBio: "Certified Strength & Conditioning Coach",
  },
  "sauna-benefits-muscle-recovery": {
    slug: "sauna-benefits-muscle-recovery",
    title: "Heat Therapy Benefits: How Saunas Improve Muscle Recovery",
    excerpt: "Explore the research on sauna therapy for muscle relaxation, detoxification, cardiovascular health, and its synergy with cold plunge protocols.",
    content: null,
    image: "/infrared_sauna_vs_traditional_sauna-1024x768.webp",
    category: "Recovery Science",
    readTime: "7 min read",
    date: "2026-04-25",
    author: "Dr. Priya Sharma",
    authorBio: "Sports Physiologist",
  },
  "cold-plunge-mental-health": {
    slug: "cold-plunge-mental-health",
    title: "Cold Plunge for Mental Health: Beyond Physical Recovery",
    excerpt: "Research shows ice baths offer powerful mental health benefits including stress reduction, improved mood, and enhanced mental resilience.",
    content: null,
    image: "/Cold-Plunge-for-Mental-Health_img.jpg",
    category: "Wellness",
    readTime: "5 min read",
    date: "2026-04-22",
    author: "Dr. Emma Wilson",
    authorBio: "Sports Psychologist",
  },
  "athlete-recovery-timing": {
    slug: "athlete-recovery-timing",
    title: "When to Use Ice Baths: Optimal Timing for Maximum Recovery",
    excerpt: "Timing matters. Learn when to schedule your cold plunge sessions relative to training for the best results in inflammation control and recovery.",
    content: null,
    image: "/CoreChill-Lifestyle.webp",
    category: "Training Tips",
    readTime: "6 min read",
    date: "2026-04-18",
    author: "Coach David Thompson",
    authorBio: "Elite Performance Coach",
  },
  "contrast-therapy-vs-ice-bath": {
    slug: "contrast-therapy-vs-ice-bath",
    title: "Contrast Therapy vs Ice Bath: Which Recovery Method is Right for You?",
    excerpt: "Compare the benefits of pure cold immersion versus alternating hot-cold cycles to determine the best recovery protocol for your training goals.",
    content: null,
    image: "/image1-3.webp",
    category: "Recovery Science",
    readTime: "7 min read",
    date: "2026-04-15",
    author: "Dr. Sarah Martinez",
    authorBio: "Sports Medicine Specialist & Recovery Research Lead",
  },
};

interface ArticleProps {
  slug: string;
  title: string;
  excerpt: string;
  content: string | null;
  image: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  authorBio: string;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const res = await fetch(`${API_URL}/api/blog/${slug}`);
    if (res.ok) {
      const post = await res.json();
      const article: ArticleProps = {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || "",
        content: post.content || null,
        image: post.cover_image_url || "/Ice-Baths-Sydney-1.jpg",
        category: "Recovery Science",
        readTime: "5 min read",
        date: (post.created_at || "").split("T")[0],
        author: "CryoRevive Team",
        authorBio: "Recovery Specialists",
      };
      return { props: { article } };
    }
  } catch {
    // fall through
  }

  const fallback = FALLBACK_ARTICLES[slug];
  if (fallback) return { props: { article: fallback } };

  return { notFound: true };
};

export default function BlogPost({ article }: { article: ArticleProps }) {
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
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors mb-8"
            >
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
                      <span>
                        {new Date(article.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
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
                  {article.content ? (
                    <div
                      className="text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  ) : (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
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
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      Book Your First Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
