import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle, Loader2, Phone } from "lucide-react";
import { API_URL } from "@/lib/api";

const SERVICE_OPTIONS = [
  { value: "ice_bath", label: "Ice Bath" },
  { value: "steam_sauna", label: "Steam Sauna" },
  { value: "contrast_therapy", label: "Contrast Therapy" },
  { value: "mobile_unit", label: "Mobile Unit" },
];

export default function Booking() {
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceType || !date) return;
    setSlotsLoading(true);
    setSelectedSlot("");
    fetch(`${API_URL}/api/slots?date=${date}&service_type=${serviceType}`)
      .then(r => r.json())
      .then(data => setSlots(data.available_slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [serviceType, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone,
          service_type: serviceType,
          date,
          time_slot: selectedSlot,
          notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create booking");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO
          title="Booking Received | CryoRevive"
          description="Your recovery session has been booked."
        />
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl font-display font-bold">Booking Received!</h2>
            <p className="text-muted-foreground">
              We&apos;ll confirm your slot via email shortly.
            </p>
          </div>
        </main>
      </>
    );
  }

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
                Choose your service, date, and time. Get instant confirmation via email.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-card border-primary/30">
              <CardHeader className="border-b border-border">
                <h2 className="text-2xl font-display font-bold">Schedule Your Recovery</h2>
                <p className="text-muted-foreground">
                  Select your service and time, then enter your details.
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Service *
                    </label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                      required
                    >
                      <option value="">Select a service</option>
                      {SERVICE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Date *
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  {serviceType && date && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" /> Available Slots *
                      </label>
                      {slotsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading slots…
                        </div>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No slots available for this date. Please try another date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 text-sm rounded-sm border transition-colors ${
                                selectedSlot === slot
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:border-primary/50"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Full Name *</label>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Phone *</label>
                      <Input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        type="tel"
                        placeholder="9891430920"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Email *</label>
                    <Input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Notes</label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any special requirements or health concerns…"
                      className="bg-background border-border min-h-[80px]"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || !selectedSlot}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking…</>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We&apos;ll confirm your slot via email within a few hours.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-background border-border">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">
                      Prefer to Book by Phone?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Call us directly or send a WhatsApp message.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="tel:+919891430920"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors"
                      >
                        Call: +91 9891430920
                      </a>
                      <a
                        href="https://wa.me/919891430920?text=Hi%2C%20I%27d%20like%20to%20book%20a%20recovery%20session"
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
      </main>
    </>
  );
}
