import { useState } from "react";
import { format } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Snowflake, Flame, Activity, CheckCircle, ChevronLeft, MapPin } from "lucide-react";
import { SERVICES } from "@/lib/services";
import type { Service } from "@/lib/services";

const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "919891430920";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const SERVICE_ICONS: Record<string, typeof Snowflake> = {
  ice_bath: Snowflake,
  steam_sauna: Flame,
  contrast_therapy: Activity,
};

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

const STEP_LABELS = ["Service", "Date & Time", "Details"];

type Step = 1 | 2 | 3 | "success";

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function Booking() {
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [notes, setNotes] = useState("");

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dateFormatted = format(selectedDate, "EEEE, dd MMMM yyyy");

    // Fire-and-forget — backend logging, non-blocking
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

    window.open(
      `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
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

  const currentStepNum = typeof step === "number" ? step : 4;

  return (
    <>
      <SEO
        title="Book a Session | CryoRevive"
        description="Book ice bath, steam sauna, or contrast therapy sessions. Instant confirmation via WhatsApp."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Book Your Recovery
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Start Your Recovery Journey
            </h1>
            <p className="text-lg text-muted-foreground">
              Pick a service, choose a slot, and confirm in seconds via WhatsApp.
            </p>
          </div>
        </section>

        {/* Booking wizard */}
        <section className="py-16 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Step progress */}
            {step !== "success" && (
              <div className="flex items-center justify-center mb-12">
                {STEP_LABELS.map((label, i) => {
                  const num = i + 1;
                  const done = currentStepNum > num;
                  const active = currentStepNum === num;
                  return (
                    <div key={num} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
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
                          className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-colors ${
                            done ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Step 1: Select Service ── */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-8 text-center">
                  Choose Your Service
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {SERVICES.map((service) => {
                    const Icon = SERVICE_ICONS[service.serviceType] ?? Snowflake;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service)}
                        className="p-6 border-2 border-border hover:border-primary rounded-sm transition-all text-center group cursor-pointer"
                      >
                        <Icon className="h-10 w-10 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <h3 className="font-display font-bold mb-1">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{service.duration}</p>
                        <p className="text-xl font-bold text-primary">{service.priceDisplay}</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {service.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 2: Date & Time ── */}
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
                    {selectedService.name} &middot; {selectedService.duration} &middot; {selectedService.priceDisplay}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
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

                  {/* Time slots */}
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
                          className={`py-2 px-2 text-sm rounded-sm border-2 transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
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

                <div className="mt-8 text-center">
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTimeSlot}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12"
                  >
                    Next: Your Details
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Details ── */}
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
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                        Book Now via WhatsApp
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        WhatsApp opens with your booking details pre-filled — just hit send.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Success ── */}
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
        </section>

        {/* Location */}
        <section className="py-16 bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-background border-border">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Visit Our Facility</h3>
                    <p className="text-muted-foreground mb-4">
                      B-94, Sector 36, Greater Noida, Uttar Pradesh
                      <br />
                      Mobile: 9891430920 &nbsp;·&nbsp; Email: info@cryorevive.in
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="tel:+919891430920"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors"
                      >
                        Call: +91 9891430920
                      </a>
                      <a
                        href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent("Hi CryoRevive! I'd like to know more about your recovery services.")}`}
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
