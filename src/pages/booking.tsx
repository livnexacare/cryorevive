import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Snowflake, Flame, Activity, Zap, CheckCircle, ChevronLeft } from "lucide-react";
import { SERVICES } from "@/lib/services";
import type { Service } from "@/lib/services";
import type { ServicePrice } from "@/lib/pricing";

const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "919891430920";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const SERVICE_ICONS: Record<string, typeof Snowflake> = {
  ice_bath: Snowflake,
  steam_sauna: Flame,
  contrast_therapy: Activity,
  cryo_chamber: Zap,
};

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

const EVENT_TYPES = [
  "Marathon / Running Event",
  "Sports Meet",
  "Gym Session",
  "Corporate Wellness",
  "Team Training Camp",
  "Other",
];

const STEP_LABELS = ["Service", "Date & Time", "Details"];

type Tab = "incentre" | "event";
type Step = 1 | 2 | 3 | "success";

const today = new Date();
today.setHours(0, 0, 0, 0);

export async function getServerSideProps() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com"}/api/pricing/services`
    );
    const prices: ServicePrice[] = await res.json();
    return { props: { prices: Array.isArray(prices) ? prices : [] } };
  } catch {
    return { props: { prices: [] } };
  }
}

export default function Booking({ prices = [] }: { prices: ServicePrice[] }) {
  const router = useRouter();

  // Merge live prices with SERVICES (for description + fallback)
  const services = useMemo<Service[]>(() => {
    const active = prices.filter((p) => p.is_active);
    if (active.length === 0) return SERVICES;
    return active.map((p) => {
      const fallback = SERVICES.find((s) => s.serviceType === p.service_type);
      return {
        id: p.service_type,
        name: p.name,
        duration: p.duration,
        price: p.price,
        priceDisplay: `₹${p.price.toLocaleString("en-IN")}`,
        description: fallback?.description ?? "",
        serviceType: p.service_type,
      };
    });
  }, [prices]);

  const [activeTab, setActiveTab] = useState<Tab>("incentre");

  // In-centre wizard state
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [notes, setNotes] = useState("");

  // Event form state
  const [eventSuccess, setEventSuccess] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTimeSlot, setEventTimeSlot] = useState("");
  const [athletes, setAthletes] = useState("");
  const [location, setLocation] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [eventPhone, setEventPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    const { service, tab } = router.query;
    if (tab === "event") {
      setActiveTab("event");
    }
    if (typeof service === "string") {
      const found = services.find((s) => s.serviceType === service);
      if (found) {
        setActiveTab("incentre");
        setSelectedService(found);
        setStep(2);
      }
    }
  }, [router.query, services]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "incentre") {
      setStep(1);
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot("");
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleInCentreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dateFormatted = format(selectedDate, "EEEE, dd MMMM yyyy");

    if (API_URL) {
      fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: `${phone.replace(/\s+/g, "")}@whatsapp.booking`,
          phone,
          service_type: selectedService.serviceType,
          date: dateStr,
          time_slot: selectedTimeSlot,
          notes,
        }),
      }).catch(() => {});
    }

    const message = `🧊 *New CryoRevive Booking Request*

*Service:* ${selectedService.name} (${selectedService.duration})
*Date:* ${dateFormatted}
*Time:* ${selectedTimeSlot}
*Name:* ${name}
*WhatsApp:* ${phone}${notes ? `\n*Notes:* ${notes}` : ""}

Please confirm my booking. Thank you!`.trim();

    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`, "_blank");
    setStep("success");
  };

  const handleBookAnother = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot("");
    setName("");
    setPhone("+91 ");
    setNotes("");
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = `🚐 *CryoRevive Mobile Event Booking*

*Event:* ${eventName}
*Type:* ${eventType}
*Date:* ${eventDate}
*Time:* ${eventTimeSlot}
*Athletes:* ${athletes}
*Location:* ${location}

*Organizer:* ${organizerName}
*Phone:* ${eventPhone}${email ? `\n*Email:* ${email}` : ""}${requirements ? `\n*Requirements:* ${requirements}` : ""}

Please contact me to confirm. Thank you!`.trim();

    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`, "_blank");
    setEventSuccess(true);
  };

  const currentStepNum = typeof step === "number" ? step : 4;

  return (
    <>
      <SEO
        title="Book a Session | CryoRevive"
        description="Book ice bath, steam sauna, contrast therapy, or cryo chamber sessions. Instant confirmation via WhatsApp."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-8 md:py-16 bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/30 rounded-sm mb-4 md:mb-6">
              <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">
                Book Your Recovery
              </p>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-3 md:mb-4">
              Start Your Recovery Journey
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              Pick a service, choose a slot, and confirm via WhatsApp.
            </p>
          </div>
        </section>

        {/* Tabs + content */}
        <section className="py-6 md:py-16 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Tab toggle */}
            <div className="flex rounded-sm border border-border overflow-hidden mb-10">
              <button
                type="button"
                onClick={() => handleTabChange("incentre")}
                className={`flex-1 py-3 px-6 text-sm font-semibold transition-colors ${
                  activeTab === "incentre"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                In-Centre Sessions
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("event")}
                className={`flex-1 py-3 px-6 text-sm font-semibold transition-colors border-l border-border ${
                  activeTab === "event"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Mobile Event Booking
              </button>
            </div>

            {/* ══ In-Centre Tab ══ */}
            {activeTab === "incentre" && (
              <div>
                {step !== "success" && (
                  <div className="flex items-center justify-center mb-8 md:mb-12">
                    {STEP_LABELS.map((label, i) => {
                      const num = i + 1;
                      const done = currentStepNum > num;
                      const active = currentStepNum === num;
                      return (
                        <div key={num} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                done
                                  ? "bg-primary text-primary-foreground"
                                  : active
                                  ? "bg-primary text-primary-foreground ring-4 ring-primary/25"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {done ? "✓" : num}
                            </div>
                            <span
                              className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                                active ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                          {i < STEP_LABELS.length - 1 && (
                            <div
                              className={`h-0.5 w-8 sm:w-16 md:w-24 mx-2 mb-5 transition-colors ${
                                done ? "bg-primary" : "bg-muted"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 1: Service */}
                {step === 1 && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-bold mb-5 md:mb-8 text-center">
                      Choose Your Service
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                      {services.map((service) => {
                        const Icon = SERVICE_ICONS[service.serviceType] ?? Snowflake;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleServiceSelect(service)}
                            className="p-4 border-2 border-border hover:border-primary rounded-2xl transition-all text-center group cursor-pointer"
                          >
                            <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                            <h3 className="font-display font-bold text-sm mb-1">{service.name}</h3>
                            <p className="text-xs text-muted-foreground">{service.duration}</p>
                            <p className="text-sm font-bold text-primary my-1">{service.priceDisplay}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {service.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>

                    <h2 className="text-2xl font-display font-bold mb-1 text-center">
                      Select Date &amp; Time
                    </h2>
                    {selectedService && (
                      <p className="text-center text-muted-foreground mb-8 text-sm">
                        {selectedService.name} &middot; {selectedService.duration}
                      </p>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="bg-card border-border">
                        <CardContent className="p-4 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => setSelectedDate(d)}
                            disabled={(date) => date < today}
                            initialFocus
                          />
                        </CardContent>
                      </Card>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm">
                          {selectedDate
                            ? `Available times for ${format(selectedDate, "EEE, d MMM")}`
                            : "Pick a date to see available times"}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              disabled={!selectedDate}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`py-2.5 px-2 text-sm rounded-xl border-2 transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                                selectedTimeSlot === slot
                                  ? "border-primary bg-primary/10 text-primary font-semibold"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                          Subject to availability — we&apos;ll confirm via WhatsApp
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <Button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!selectedDate || !selectedTimeSlot}
                        size="lg"
                        className="w-full md:w-auto md:px-12 py-3 text-sm rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        Next: Your Details
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>

                    <h2 className="text-2xl font-display font-bold mb-1 text-center">
                      Your Details
                    </h2>
                    {selectedService && selectedDate && (
                      <p className="text-center text-sm text-muted-foreground mb-8">
                        {selectedService.name} &middot; {format(selectedDate, "d MMM yyyy")} &middot; {selectedTimeSlot}
                      </p>
                    )}

                    <Card className="bg-card border-border max-w-lg mx-auto">
                      <CardContent className="p-6">
                        <form onSubmit={handleInCentreSubmit} className="space-y-5">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-foreground">
                              Full Name *
                            </label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                              WhatsApp Number *
                            </label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 98914 30920"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              We&apos;ll send your booking confirmation to this number
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-semibold text-foreground">
                              Notes (Optional)
                            </label>
                            <Textarea
                              id="notes"
                              placeholder="Any health concerns, preferences, or questions…"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="bg-background border-border min-h-[80px]"
                            />
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                            disabled={!name.trim() || phone.trim().length < 6}
                          >
                            Book via WhatsApp
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            WhatsApp opens with your booking details pre-filled — just hit send.
                          </p>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Success */}
                {step === "success" && (
                  <Card className="bg-card border-border max-w-lg mx-auto">
                    <CardContent className="py-16 text-center space-y-4">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <h2 className="text-2xl font-display font-bold">Booking request sent!</h2>
                      <p className="text-muted-foreground">
                        We&apos;ll confirm your slot on WhatsApp shortly.
                      </p>
                      <Button
                        type="button"
                        onClick={handleBookAnother}
                        variant="outline"
                        className="mt-2"
                      >
                        Book Another Session
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ══ Event Tab ══ */}
            {activeTab === "event" && (
              <div>
                {eventSuccess ? (
                  <Card className="bg-card border-border max-w-lg mx-auto">
                    <CardContent className="py-16 text-center space-y-4">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <h2 className="text-2xl font-display font-bold">Request sent!</h2>
                      <p className="text-muted-foreground">
                        We&apos;ll be in touch shortly to confirm your event booking.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEventSuccess(false)}
                        className="mt-2"
                      >
                        Submit Another Request
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 sm:p-8">
                      <h2 className="text-2xl font-display font-bold mb-6">Mobile Event Details</h2>
                      <form onSubmit={handleEventSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="eventName" className="text-sm font-semibold text-foreground">
                              Event Name *
                            </label>
                            <Input
                              id="eventName"
                              type="text"
                              placeholder="Delhi Marathon 2025"
                              value={eventName}
                              onChange={(e) => setEventName(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="eventType" className="text-sm font-semibold text-foreground">
                              Event Type *
                            </label>
                            <select
                              id="eventType"
                              value={eventType}
                              onChange={(e) => setEventType(e.target.value)}
                              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              required
                            >
                              <option value="" disabled>Select type…</option>
                              {EVENT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
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
                          <div className="space-y-2">
                            <label htmlFor="eventTimeSlot" className="text-sm font-semibold text-foreground">
                              Preferred Time *
                            </label>
                            <Input
                              id="eventTimeSlot"
                              type="text"
                              placeholder="e.g. 6:00 AM – 10:00 AM"
                              value={eventTimeSlot}
                              onChange={(e) => setEventTimeSlot(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="athletes" className="text-sm font-semibold text-foreground">
                              Expected Athletes *
                            </label>
                            <Input
                              id="athletes"
                              type="text"
                              placeholder="e.g. 50–100"
                              value={athletes}
                              onChange={(e) => setAthletes(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="location" className="text-sm font-semibold text-foreground">
                              Event Location *
                            </label>
                            <Input
                              id="location"
                              type="text"
                              placeholder="Venue name, city"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        <div className="border-t border-border pt-5">
                          <p className="text-sm font-semibold mb-4">Organizer Details</p>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="organizerName" className="text-sm font-semibold text-foreground">
                                Full Name *
                              </label>
                              <Input
                                id="organizerName"
                                type="text"
                                placeholder="Your name"
                                value={organizerName}
                                onChange={(e) => setOrganizerName(e.target.value)}
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="eventPhone" className="text-sm font-semibold text-foreground">
                                  WhatsApp Number *
                                </label>
                                <Input
                                  id="eventPhone"
                                  type="tel"
                                  placeholder="+91 98914 30920"
                                  value={eventPhone}
                                  onChange={(e) => setEventPhone(e.target.value)}
                                  className="bg-background border-border"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                                  Email (Optional)
                                </label>
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="bg-background border-border"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="requirements" className="text-sm font-semibold text-foreground">
                            Special Requirements (Optional)
                          </label>
                          <Textarea
                            id="requirements"
                            placeholder="Power supply, space constraints, specific equipment…"
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="bg-background border-border min-h-[80px]"
                          />
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                          disabled={
                            !eventName.trim() || !eventType || !eventDate ||
                            !eventTimeSlot.trim() || !athletes.trim() || !location.trim() ||
                            !organizerName.trim() || eventPhone.trim().length < 6
                          }
                        >
                          Send Booking Request via WhatsApp
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          WhatsApp opens with your event details pre-filled — just hit send.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
