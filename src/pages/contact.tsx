import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Clock, Users, CheckCircle, Truck } from "lucide-react";
import Link from "next/link";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918595850920";

export default function Contact() {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    const msg = `Hi CryoRevive! Message from ${name} (${email}${phone ? ", " + phone : ""}): ${message}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setSuccess(true);
  };

  return (
    <>
      <SEO
        title="Contact | CryoRevive — Book Recovery or Event Services"
        description="Get in touch with CryoRevive. Book recovery sessions, inquire about mobile event services, or ask us anything via WhatsApp."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Get In Touch
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Contact Us
              </h1>
              <p className="text-lg text-muted-foreground">
                Questions about recovery sessions, event bookings, or our mobile unit? We respond fastest on WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-display font-bold mb-6">Send a Message</h2>
                {success ? (
                  <Card className="bg-card border-primary/30">
                    <CardContent className="py-16 text-center space-y-4">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <h3 className="text-2xl font-display font-bold">Message Sent!</h3>
                      <p className="text-muted-foreground">
                        WhatsApp opened with your message. We&apos;ll reply shortly.
                      </p>
                      <Link href="/booking">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          Book a Session
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 sm:p-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-foreground">
                              Full Name *
                            </label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              placeholder="John Doe"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                              Phone Number
                            </label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              placeholder="8595850920"
                              className="bg-background border-border"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-semibold text-foreground">
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="bg-background border-border"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="message" className="text-sm font-semibold text-foreground">
                            Message *
                          </label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder="Tell us about your recovery goals, event requirements, or any questions…"
                            className="bg-background border-border min-h-[140px]"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Send via WhatsApp
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          WhatsApp will open with your message pre-filled. Just hit send.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Info + What We Bring */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-display font-bold mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <Card className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Facility</h3>
                            <p className="text-sm text-muted-foreground">
                              B-94, Sector 36<br />
                              Greater Noida, Uttar Pradesh
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <Phone className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Call / WhatsApp</h3>
                            <a href="tel:+918595850920" className="text-sm text-primary hover:underline">
                              +91 8595850920
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Email</h3>
                            <a href="mailto:info@cryorevive.in" className="text-sm text-primary hover:underline block">
                              info@cryorevive.in
                            </a>
                            <a href="mailto:support@cryorevive.in" className="text-sm text-primary hover:underline block">
                              support@cryorevive.in
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <h3 className="text-xl font-display font-bold">What We Bring to Your Event</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Professional Setup</p>
                        <p className="text-xs text-muted-foreground">Mobile cold plunge units and trained recovery specialists</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Flexible Timing</p>
                        <p className="text-xs text-muted-foreground">Sessions scheduled around your event timeline</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-accent/10 w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Scalable Service</p>
                        <p className="text-xs text-muted-foreground">From 10 to 500+ athletes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Truck className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold mb-1">Planning an event?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Book our Mobile Recovery Unit for your marathon, sports day, or team training camp.
                        </p>
                        <Link href="/booking?tab=event">
                          <button className="inline-flex items-center justify-center px-5 py-2.5 bg-accent hover:bg-accent/90 text-background text-sm font-semibold rounded-sm transition-colors">
                            Book Mobile Event
                          </button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to Book?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Visit our booking page to select your session and confirm via WhatsApp in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Book a Session
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="border-border hover:bg-background font-semibold">
                  View Services
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
