import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, CreditCard, Phone } from "lucide-react";

export default function Booking() {
  return (
    <>
      <SEO 
        title="Book Your Recovery Session | CryoRevive Booking"
        description="Schedule your ice bath, sauna, or contrast therapy session. Easy online booking with instant confirmation."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Start Your Recovery Journey
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Book Your Session
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your preferred date and time. Get instant confirmation for your recovery session.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold">Select Date & Time</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from available slots that fit your schedule
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-display font-bold">Instant Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive booking confirmation via email and SMS
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold">Secure Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay online or at the facility — your choice
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-card border-primary/30">
                <CardHeader className="border-b border-border">
                  <h2 className="text-2xl font-display font-bold">Schedule Your Recovery</h2>
                  <p className="text-muted-foreground">
                    Select your service and preferred time slot below
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="aspect-[4/3] bg-muted/20 rounded-sm border border-border flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <Calendar className="h-16 w-16 text-primary mx-auto" />
                      <h3 className="text-xl font-display font-bold">Calendly Integration Placeholder</h3>
                      <p className="text-muted-foreground max-w-md">
                        Replace this section with your Calendly or TidyCal embed code. 
                        <br />
                        <br />
                        Example:
                        <br />
                        <code className="text-xs bg-background px-2 py-1 rounded text-primary">
                          &lt;div className=&quot;calendly-inline-widget&quot; data-url=&quot;YOUR_CALENDLY_URL&quot;&gt;&lt;/div&gt;
                        </code>
                      </p>
                      <p className="text-sm text-muted-foreground pt-4">
                        Add the Calendly widget script to <code className="text-primary">_app.tsx</code> or <code className="text-primary">_document.tsx</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-background border-border">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">
                      Prefer to Book by Phone?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Call us directly or send a WhatsApp message for assistance with booking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href="tel:+919876543210"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors"
                      >
                        Call: +91 98765 43210
                      </a>
                      <a 
                        href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20book%20a%20recovery%20session"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-sm transition-colors"
                      >
                        WhatsApp Us
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              What to Expect
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-2">
                  <div className="text-primary font-display font-bold text-lg">Before Your Session</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Arrive 10 minutes early</li>
                    <li>• Wear comfortable clothing</li>
                    <li>• Hydrate well before arrival</li>
                    <li>• Avoid heavy meals 2 hours prior</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-2">
                  <div className="text-accent font-display font-bold text-lg">What We Provide</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Towels and robes</li>
                    <li>• Shower facilities</li>
                    <li>• Post-session refreshments</li>
                    <li>• Professional supervision</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}