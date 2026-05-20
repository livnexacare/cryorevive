import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Contact() {
  return (
    <>
      <SEO 
        title="Contact CryoRevive | Get In Touch - Recovery Facility"
        description="Contact CryoRevive for inquiries, bookings, or questions. Call, WhatsApp, or visit our location."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  We're Here to Help
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Get In Touch
              </h1>
              <p className="text-lg text-muted-foreground">
                Questions about our recovery services? Ready to book? Contact us and we'll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-display font-bold mb-6">Send Us a Message</h2>
                  <Card className="bg-card border-border">
                    <CardContent className="p-8">
                      <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-foreground">
                              Full Name *
                            </label>
                            <Input 
                              id="name"
                              type="text" 
                              placeholder="Your name"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                              Phone Number *
                            </label>
                            <Input 
                              id="phone"
                              type="tel" 
                              placeholder="+91 98765 43210"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-semibold text-foreground">
                            Email Address *
                          </label>
                          <Input 
                            id="email"
                            type="email" 
                            placeholder="your@email.com"
                            className="bg-background border-border"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="subject" className="text-sm font-semibold text-foreground">
                            Subject
                          </label>
                          <Input 
                            id="subject"
                            type="text" 
                            placeholder="What is this regarding?"
                            className="bg-background border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="message" className="text-sm font-semibold text-foreground">
                            Message *
                          </label>
                          <Textarea 
                            id="message"
                            placeholder="Tell us about your recovery goals or any questions you have..."
                            className="bg-background border-border min-h-[150px]"
                            required
                          />
                        </div>

                        <Button 
                          type="submit"
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                          Send Message
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          We typically respond within 24 hours during business hours
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-accent/10 border-accent/30">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-accent/20 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold mb-2">
                          Prefer WhatsApp?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get instant responses to your recovery questions
                        </p>
                        <a 
                          href="https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20question%20about%20CryoRevive"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-sm transition-colors"
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-display font-bold mb-6">Visit Us</h2>
                  
                  <div className="space-y-6">
                    <Card className="bg-card border-border">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Location</h3>
                            <p className="text-sm text-muted-foreground">
                              123 Recovery Street<br />
                              Indiranagar, Bangalore 560038<br />
                              Karnataka, India
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <Phone className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Phone</h3>
                            <a 
                              href="tel:+919876543210" 
                              className="text-sm text-primary hover:underline"
                            >
                              +91 98765 43210
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-1">Email</h3>
                            <a 
                              href="mailto:info@cryorevive.com" 
                              className="text-sm text-primary hover:underline"
                            >
                              info@cryorevive.com
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                            <Clock className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold mb-2">Hours</h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Monday - Friday: 6:00 AM - 10:00 PM</p>
                              <p>Saturday: 7:00 AM - 9:00 PM</p>
                              <p>Sunday: 7:00 AM - 8:00 PM</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-display font-bold mb-4">Find Us on the Map</h3>
                  <Card className="bg-card border-border overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted/20 flex items-center justify-center">
                        <div className="text-center space-y-3 p-8">
                          <MapPin className="h-12 w-12 text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground max-w-sm">
                            <strong className="text-foreground">Google Maps Embed Placeholder</strong>
                            <br />
                            <br />
                            Replace this div with your Google Maps iframe embed code:
                            <br />
                            <code className="text-xs bg-background px-2 py-1 rounded text-primary">
                              &lt;iframe src=&quot;YOUR_GOOGLE_MAPS_URL&quot; ...&gt;&lt;/iframe&gt;
                            </code>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to Start Your Recovery Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book your first session and experience elite athlete recovery.
            </p>
            <Link href="/booking">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Book Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}