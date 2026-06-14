import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { format, addHours, isBefore } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";
const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "918595850920";

const EVENT_TYPES = [
  "Marathon / Running Event",
  "Sports Meet",
  "Gym Session",
  "Corporate Wellness",
  "Team Training Camp",
  "Other",
];

type Tab = "incentre" | "event";

export default function Booking() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("incentre");

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
  const [eventDateError, setEventDateError] = useState("");

  const minEventDateStr = format(addHours(new Date(), 48), "yyyy-MM-dd");

  useEffect(() => {
    const { tab } = router.query;
    if (tab === "event") {
      setActiveTab("event");
    }
  }, [router.query]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (eventDate) {
      const selected = new Date(eventDate + "T00:00:00");
      const minDate = addHours(new Date(), 48);
      if (isBefore(selected, minDate)) {
        setEventDateError("Event bookings require at least 48 hours notice");
        return;
      }
    }
    setEventDateError("");

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
              <div className="max-w-2xl mx-auto py-12 px-4">

                {/* Status Card */}
                <div className="bg-gray-900/80 border border-amber-500/30
                                rounded-2xl p-8 text-center
                                shadow-xl shadow-amber-500/10">

                  {/* Icon */}
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30
                                  rounded-2xl flex items-center justify-center
                                  mx-auto mb-6">
                    <span className="text-3xl">🏗️</span>
                  </div>

                  {/* Heading */}
                  <h2 className="text-white text-2xl font-bold mb-3">
                    Centre Coming Soon
                  </h2>

                  {/* Message */}
                  <p className="text-gray-300 text-base leading-relaxed mb-6">
                    Our dedicated recovery centre is currently being set up.
                    We are excited to open our doors soon!
                  </p>

                  {/* Divider */}
                  <div className="border-t border-white/10 my-6" />

                  {/* Current offering */}
                  <div className="bg-cyan-950/50 border border-cyan-500/20
                                  rounded-xl p-5 mb-6 text-left">
                    <p className="text-cyan-300 font-semibold text-sm mb-3
                                  flex items-center gap-2">
                      <span>✅</span> Currently Available
                    </p>
                    <p className="text-white font-bold text-lg mb-2">
                      Mobile Recovery Unit
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      We bring professional cold therapy &amp; sauna recovery
                      directly to your home, gym, or event —
                      for groups of <strong className="text-white">10 or more people</strong>.
                    </p>

                    <div className="mt-4 space-y-2">
                      {[
                        '🏠 At your home or residence',
                        '🏋️ At your gym or sports academy',
                        '🏃 At marathons and athletic events',
                        '🎯 Corporate wellness events',
                        '⚡ Minimum 10 participants',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('event')}
                      className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500
                                 text-white font-bold rounded-xl transition-colors
                                 text-sm"
                    >
                      📅 Book Mobile Recovery Unit
                    </button>

                    <a
                      href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Hi! I want to know more about CryoRevive mobile recovery for my group.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 border border-white/20
                                 hover:border-white/40 hover:bg-white/5
                                 text-white font-semibold rounded-xl
                                 transition-colors text-sm text-center"
                    >
                      💬 Ask on WhatsApp
                    </a>
                  </div>

                  {/* Studio opening teaser */}
                  <p className="text-gray-600 text-xs mt-6">
                    🧊 Dedicated recovery centre opening soon in Delhi NCR
                  </p>
                </div>
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
                              onChange={(e) => {
                                const selected = new Date(e.target.value + "T00:00:00");
                                const minDate = addHours(new Date(), 48);
                                if (isBefore(selected, minDate)) {
                                  setEventDateError("Event bookings require at least 48 hours notice");
                                  setEventDate("");
                                  return;
                                }
                                setEventDateError("");
                                setEventDate(e.target.value);
                              }}
                              min={minEventDateStr}
                              className="bg-background border-border"
                              required
                            />
                            {eventDateError && (
                              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <span>⚠</span> {eventDateError}
                              </p>
                            )}
                            <p className="text-muted-foreground text-xs">
                              Event bookings require minimum 48 hours advance notice
                            </p>
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
