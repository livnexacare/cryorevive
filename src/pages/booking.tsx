import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Snowflake, Flame, Activity, CheckCircle } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { API_URL, parseTimeSlot } from "@/lib/api";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919891430920";

const SERVICE_ICONS: Record<string, typeof Snowflake> = {
  ice_bath: Snowflake,
  steam_sauna: Flame,
  contrast_therapy: Activity,
};

const TIME_SLOTS = [
  "05:00 AM - 06:00 AM",
  "06:00 AM - 08:00 AM",
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
  "08:00 PM - 10:00 PM",
];

const EVENT_TYPES = [
  "Marathon / Running Event",
  "Triathlon",
  "Cycling Race",
  "CrossFit Competition",
  "Sports Tournament",
  "Other Athletic Event",
];

function openWhatsApp(number: string, message: string) {
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
}

function SuccessCard({ message }: { message: string }) {
  return (
    <Card className="bg-card border-primary/30">
      <CardContent className="py-16 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-display font-bold">Booking Confirmed!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function Booking() {
  const [activeTab, setActiveTab] = useState("centre");

  // In-Centre state
  const [selectedService, setSelectedService] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [centreSuccess, setCentreSuccess] = useState(false);

  // Mobile Event state
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [expectedAthletes, setExpectedAthletes] = useState("");
  const [eventSuccess, setEventSuccess] = useState(false);

  const handleCentreBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("customerName") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("customerPhone") as HTMLInputElement).value;
    const email = (form.elements.namedItem("customerEmail") as HTMLInputElement).value;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value;

    const service = SERVICES.find((s) => s.serviceType === selectedService);
    if (!service) return;

    // Silently log to backend — fire-and-forget
    fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        service_type: selectedService,
        date: sessionDate,
        time_slot: parseTimeSlot(sessionTime),
        notes: notes || "",
      }),
    }).catch(() => {});

    const msg = `Hi CryoRevive! I'd like to book: ${service.name} on ${sessionDate} at ${sessionTime}. Name: ${name}. Phone: ${phone}.`;
    openWhatsApp(WA_NUMBER, msg);
    setCentreSuccess(true);
  };

  const handleEventBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const eventName = (form.elements.namedItem("eventName") as HTMLInputElement).value;
    const location = (form.elements.namedItem("eventLocation") as HTMLInputElement).value;
    const organizerName = (form.elements.namedItem("organizerName") as HTMLInputElement).value;
    const organizerPhone = (form.elements.namedItem("organizerPhone") as HTMLInputElement).value;
    const organizerEmail = (form.elements.namedItem("organizerEmail") as HTMLInputElement).value;
    const specialReqs = (form.elements.namedItem("specialRequirements") as HTMLTextAreaElement).value;

    // Silently log to backend — fire-and-forget
    fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: organizerName,
        email: organizerEmail,
        phone: organizerPhone,
        service_type: "mobile_unit",
        date: eventDate,
        time_slot: parseTimeSlot(eventTime),
        notes: [eventName, eventType, location, `${expectedAthletes} athletes`, specialReqs]
          .filter(Boolean)
          .join(" | "),
      }),
    }).catch(() => {});

    const msg = `Hi CryoRevive! I'd like to book a Mobile Recovery Unit. Event: ${eventName}, Date: ${eventDate}, Time: ${eventTime}, Athletes: ${expectedAthletes}, Location: ${location}. Organizer: ${organizerName}, Phone: ${organizerPhone}.`;
    openWhatsApp(WA_NUMBER, msg);
    setEventSuccess(true);
  };

  return (
    <>
      <SEO
        title="Book Recovery Session | CryoRevive Booking"
        description="Book in-centre recovery sessions or mobile event recovery services. Ice bath, sauna, and contrast therapy — confirm via WhatsApp."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Book Your Recovery
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Start Your Recovery Journey
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your session, fill in your details, and book instantly via WhatsApp. We'll confirm your slot within minutes.
              </p>
            </div>
          </div>
        </section>

        {/* Booking Forms */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="centre" className="text-base">
                  In-Centre Sessions
                </TabsTrigger>
                <TabsTrigger value="mobile" className="text-base">
                  Mobile Event Booking
                </TabsTrigger>
              </TabsList>

              {/* In-Centre Session Tab */}
              <TabsContent value="centre">
                {centreSuccess ? (
                  <SuccessCard message="We will contact you on WhatsApp to confirm your slot." />
                ) : (
                  <Card className="bg-card border-primary/30">
                    <CardHeader className="border-b border-border">
                      <h2 className="text-2xl font-display font-bold">Book In-Centre Session</h2>
                      <p className="text-muted-foreground">
                        Schedule your recovery session at our facility
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Service Selection */}
                      <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {SERVICES.map((service) => {
                          const Icon = SERVICE_ICONS[service.serviceType] ?? Snowflake;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setSelectedService(service.serviceType)}
                              className={`p-4 border-2 rounded-sm transition-all text-left ${
                                selectedService === service.serviceType
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Icon
                                className={`h-8 w-8 mx-auto mb-3 ${
                                  selectedService === service.serviceType
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <h3 className="font-display font-bold mb-1 text-center">{service.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2 text-center">{service.duration}</p>
                              <p className="text-lg font-bold text-primary text-center">{service.priceDisplay}</p>
                              <p className="text-xs text-muted-foreground mt-2 text-center">{service.description}</p>
                            </button>
                          );
                        })}
                      </div>

                      {selectedService && (
                        <form onSubmit={handleCentreBooking} className="space-y-6">
                          {/* Date & Time */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="sessionDate" className="text-sm font-semibold text-foreground">
                                Session Date *
                              </label>
                              <Input
                                id="sessionDate"
                                type="date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="sessionTime" className="text-sm font-semibold text-foreground">
                                Time Slot *
                              </label>
                              <select
                                id="sessionTime"
                                value={sessionTime}
                                onChange={(e) => setSessionTime(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                required
                              >
                                <option value="">Select time slot</option>
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="customerName" className="text-sm font-semibold text-foreground">
                                Full Name *
                              </label>
                              <Input
                                id="customerName"
                                name="customerName"
                                type="text"
                                placeholder="John Doe"
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="customerPhone" className="text-sm font-semibold text-foreground">
                                  Phone Number *
                                </label>
                                <Input
                                  id="customerPhone"
                                  name="customerPhone"
                                  type="tel"
                                  placeholder="9891430920"
                                  className="bg-background border-border"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="customerEmail" className="text-sm font-semibold text-foreground">
                                  Email Address
                                </label>
                                <Input
                                  id="customerEmail"
                                  name="customerEmail"
                                  type="email"
                                  placeholder="you@example.com"
                                  className="bg-background border-border"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="notes" className="text-sm font-semibold text-foreground">
                                Special Requests (Optional)
                              </label>
                              <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Any health concerns or special requirements"
                                className="bg-background border-border min-h-[80px]"
                              />
                            </div>
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                          >
                            Book Now via WhatsApp
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            WhatsApp will open with a pre-filled message. Just hit send — we&apos;ll confirm your slot promptly.
                          </p>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Mobile Event Booking Tab */}
              <TabsContent value="mobile">
                {eventSuccess ? (
                  <SuccessCard message="We will contact you on WhatsApp to confirm your event booking and discuss requirements." />
                ) : (
                  <Card className="bg-card border-primary/30">
                    <CardHeader className="border-b border-border">
                      <h2 className="text-2xl font-display font-bold">Book Mobile Event Recovery</h2>
                      <p className="text-muted-foreground">
                        Invite us to provide recovery services at your athletic event
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleEventBooking} className="space-y-6">
                        {/* Event Details */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="eventName" className="text-sm font-semibold text-foreground">
                              Event Name *
                            </label>
                            <Input
                              id="eventName"
                              name="eventName"
                              type="text"
                              placeholder="e.g., Delhi Half Marathon 2026"
                              className="bg-background border-border"
                              required
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="eventType" className="text-sm font-semibold text-foreground">
                                Event Type *
                              </label>
                              <select
                                id="eventType"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                required
                              >
                                <option value="">Select event type</option>
                                {EVENT_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="eventDate" className="text-sm font-semibold text-foreground">
                                Event Date *
                              </label>
                              <Input
                                id="eventDate"
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="bg-background border-border"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="eventTime" className="text-sm font-semibold text-foreground">
                                Preferred Time Slot *
                              </label>
                              <select
                                id="eventTime"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                required
                              >
                                <option value="">Select time slot</option>
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="expectedAthletes" className="text-sm font-semibold text-foreground">
                                Expected Athletes *
                              </label>
                              <Input
                                id="expectedAthletes"
                                type="number"
                                min="1"
                                value={expectedAthletes}
                                onChange={(e) => setExpectedAthletes(e.target.value)}
                                placeholder="e.g., 150"
                                className="bg-background border-border"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="eventLocation" className="text-sm font-semibold text-foreground">
                              Event Location *
                            </label>
                            <Input
                              id="eventLocation"
                              name="eventLocation"
                              type="text"
                              placeholder="Full event address"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        {/* Organizer Details */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-display font-bold">Organizer Contact</h3>
                          <div className="space-y-2">
                            <label htmlFor="organizerName" className="text-sm font-semibold text-foreground">
                              Organizer Name *
                            </label>
                            <Input
                              id="organizerName"
                              name="organizerName"
                              type="text"
                              placeholder="Your name"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="organizerPhone" className="text-sm font-semibold text-foreground">
                                Phone Number *
                              </label>
                              <Input
                                id="organizerPhone"
                                name="organizerPhone"
                                type="tel"
                                placeholder="9891430920"
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="organizerEmail" className="text-sm font-semibold text-foreground">
                                Email Address
                              </label>
                              <Input
                                id="organizerEmail"
                                name="organizerEmail"
                                type="email"
                                placeholder="you@example.com"
                                className="bg-background border-border"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="specialRequirements" className="text-sm font-semibold text-foreground">
                              Special Requirements (Optional)
                            </label>
                            <Textarea
                              id="specialRequirements"
                              name="specialRequirements"
                              placeholder="Any specific needs or requests for the event"
                              className="bg-background border-border min-h-[80px]"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                          disabled={!expectedAthletes}
                        >
                          Book via WhatsApp
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          WhatsApp will open with your event details. We&apos;ll confirm pricing and logistics promptly.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Location Info */}
        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-background border-border">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Visit Our Facility</h3>
                    <p className="text-muted-foreground mb-4">
                      B-94, Sector 36, Greater Noida, Uttar Pradesh
                      <br />
                      Mobile: 9891430920
                      <br />
                      Email: info@cryorevive.in
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="tel:+919891430920"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors"
                      >
                        Call: +91 9891430920
                      </a>
                      <a
                        href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi CryoRevive! I'd like to know more about your recovery services.")}`}
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
      <Footer />
    </>
  );
}
