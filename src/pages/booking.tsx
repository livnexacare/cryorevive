import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { format, addDays, addHours, isBefore, isToday } from "date-fns";
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

const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "918595850920";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const SERVICE_ICONS: Record<string, typeof Snowflake> = {
  ice_bath: Snowflake,
  steam_sauna: Flame,
  contrast_therapy: Activity,
  cryo_chamber: Zap,
};

const MASTER_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

function getAvailableTimeSlots(date: Date): string[] {
  if (!isToday(date)) return MASTER_SLOTS;
  const cutoff = addHours(new Date(), 2);
  return MASTER_SLOTS.filter((slot) => {
    const [time, period] = slot.split(" ");
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const min = parseInt(m, 10) || 0;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    const slotDate = new Date(date);
    slotDate.setHours(hour, min, 0, 0);
    return slotDate > cutoff;
  });
}

const EVENT_TYPES = [
  "Marathon / Running Event",
  "Sports Meet",
  "Gym Session",
  "Corporate Wellness",
  "Team Training Camp",
  "Other",
];

const GOALS = ["Recovery", "Muscle Soreness", "Fat Loss", "General Wellness", "Athletic Performance", "Other"];
const REFERRAL_SOURCES = ["Friend", "Instagram", "Google", "Gym", "Event", "Other"];

const HEALTH_ITEMS: { key: keyof BookingDetails; label: string }[] = [
  { key: "health_high_bp", label: "High Blood Pressure" },
  { key: "health_seizures", label: "Seizures" },
  { key: "health_heart", label: "Heart Condition" },
  { key: "health_diabetes", label: "Diabetes" },
  { key: "health_asthma", label: "Asthma" },
  { key: "health_pregnancy", label: "Pregnancy" },
];

const STEP_LABELS = ["Service", "Date & Time", "Details"];

type Tab = "incentre" | "event";
type Step = 1 | 2 | 3 | "success";

interface BookingDetails {
  full_name: string;
  mobile: string;
  email: string;
  age: string;
  gender: "" | "Male" | "Female" | "Other";
  address: string;
  health_high_bp: boolean;
  health_heart: boolean;
  health_asthma: boolean;
  health_seizures: boolean;
  health_diabetes: boolean;
  health_pregnancy: boolean;
  health_other: string;
  primary_goal: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relation: string;
  referral_source: string;
  referral_code: string;
  first_time: boolean;
  consent_accepted: boolean;
}

const EMPTY_DETAILS: BookingDetails = {
  full_name: "",
  mobile: "+91 ",
  email: "",
  age: "",
  gender: "",
  address: "",
  health_high_bp: false,
  health_heart: false,
  health_asthma: false,
  health_seizures: false,
  health_diabetes: false,
  health_pregnancy: false,
  health_other: "",
  primary_goal: "",
  emergency_name: "",
  emergency_phone: "",
  emergency_relation: "",
  referral_source: "",
  referral_code: "",
  first_time: false,
  consent_accepted: false,
};

const today = new Date();
today.setHours(0, 0, 0, 0);
const maxDate = addDays(today, 30);

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
  const [details, setDetails] = useState<BookingDetails>(EMPTY_DETAILS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const availableSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : MASTER_SLOTS;
  const minEventDateStr = format(addHours(new Date(), 48), "yyyy-MM-dd");

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

  const setDetail = <K extends keyof BookingDetails>(key: K, value: BookingDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const detailsValid =
    details.full_name.trim().length > 0 &&
    details.mobile.replace(/\s+/g, "").length >= 10 &&
    details.consent_accepted;

  const buildWhatsAppMessage = () => {
    if (!selectedService || !selectedDate) return "";

    const healthConditions = [
      details.health_high_bp && "High BP",
      details.health_heart && "Heart Condition",
      details.health_asthma && "Asthma",
      details.health_seizures && "Seizures",
      details.health_diabetes && "Diabetes",
      details.health_pregnancy && "Pregnancy",
      details.health_other.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const lines: string[] = [
      "*New CryoRevive Booking Request*",
      "",
      `*Service:* ${selectedService.name} (${selectedService.duration})`,
      `*Date:* ${format(selectedDate, "EEEE, dd MMMM yyyy")}`,
      `*Time:* ${selectedTimeSlot}`,
      `*Price:* ${selectedService.priceDisplay}`,
      "",
      `*Name:* ${details.full_name}`,
      `*WhatsApp:* ${details.mobile}`,
    ];
    if (details.email) lines.push(`*Email:* ${details.email}`);
    if (details.age) lines.push(`*Age:* ${details.age}`);
    if (details.gender) lines.push(`*Gender:* ${details.gender}`);
    if (details.address) lines.push(`*Address:* ${details.address}`);
    if (details.primary_goal) lines.push(`*Goal:* ${details.primary_goal}`);
    if (healthConditions) lines.push(`*Health Notes:* ${healthConditions}`);
    if (details.first_time) lines.push("*First-time visitor*");
    if (details.referral_source) {
      lines.push(
        `*Heard via:* ${details.referral_source}${details.referral_code ? ` (${details.referral_code})` : ""}`
      );
    }
    lines.push("", "_Please confirm the slot and share payment details._");

    return lines.join("\n").trim();
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;

    if (!details.consent_accepted) {
      setSubmitError("Please accept the Terms & Conditions and Liability Waiver");
      return;
    }
    if (!detailsValid) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    // Save to backend in the background — WhatsApp is the primary confirmation path
    fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: details.full_name,
        email: details.email || `${details.mobile.replace(/\s+/g, "")}@whatsapp.booking`,
        phone: details.mobile,
        service_type: selectedService.serviceType,
        date: format(selectedDate, "yyyy-MM-dd"),
        time_slot: selectedTimeSlot,
        notes: JSON.stringify({
          age: details.age,
          gender: details.gender,
          address: details.address,
          health: {
            high_bp: details.health_high_bp,
            heart: details.health_heart,
            asthma: details.health_asthma,
            seizures: details.health_seizures,
            diabetes: details.health_diabetes,
            pregnancy: details.health_pregnancy,
            other: details.health_other,
          },
          goal: details.primary_goal,
          emergency: {
            name: details.emergency_name,
            phone: details.emergency_phone,
            relation: details.emergency_relation,
          },
          referral: details.referral_source,
          referral_code: details.referral_code,
          first_time: details.first_time,
        }),
      }),
    }).catch(() => {});

    const message = buildWhatsAppMessage();
    setSubmitting(false);
    setStep("success");

    setTimeout(() => {
      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`, "_blank");
    }, 500);
  };

  const handleBookAnother = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot("");
    setDetails(EMPTY_DETAILS);
    setSubmitError("");
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
              Pick a service, choose your slot, share details — we&apos;ll confirm &amp; collect payment.
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
                            onSelect={(d) => { setSelectedDate(d); setSelectedTimeSlot(""); }}
                            disabled={(date) => isBefore(date, today) || date > maxDate}
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
                          {availableSlots.map((slot) => (
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
                        {selectedDate && isToday(selectedDate) && availableSlots.length === 0 && (
                          <p className="text-amber-400 text-sm text-center py-4">
                            No slots available today. Please select a future date or call us at +91 8595850920 for same-day bookings.
                          </p>
                        )}
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

                {/* Step 3: Details + Payment */}
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
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                          className="space-y-6"
                        >
                          {/* Personal details */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="full_name" className="text-sm font-semibold text-foreground">
                                Full Name *
                              </label>
                              <Input
                                id="full_name"
                                type="text"
                                placeholder="John Doe"
                                value={details.full_name}
                                onChange={(e) => setDetail("full_name", e.target.value)}
                                className="bg-background border-border"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                                  WhatsApp Number *
                                </label>
                                <Input
                                  id="mobile"
                                  type="tel"
                                  placeholder="+91 98914 30920"
                                  value={details.mobile}
                                  onChange={(e) => setDetail("mobile", e.target.value)}
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
                                  value={details.email}
                                  onChange={(e) => setDetail("email", e.target.value)}
                                  className="bg-background border-border"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="age" className="text-sm font-semibold text-foreground">
                                  Age (Optional)
                                </label>
                                <Input
                                  id="age"
                                  type="number"
                                  min={1}
                                  placeholder="28"
                                  value={details.age}
                                  onChange={(e) => setDetail("age", e.target.value)}
                                  className="bg-background border-border"
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="gender" className="text-sm font-semibold text-foreground">
                                  Gender (Optional)
                                </label>
                                <select
                                  id="gender"
                                  value={details.gender}
                                  onChange={(e) => setDetail("gender", e.target.value as BookingDetails["gender"])}
                                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <option value="" disabled>Select…</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="address" className="text-sm font-semibold text-foreground">
                                Address (Optional)
                              </label>
                              <Input
                                id="address"
                                type="text"
                                placeholder="Street, city"
                                value={details.address}
                                onChange={(e) => setDetail("address", e.target.value)}
                                className="bg-background border-border"
                              />
                            </div>
                          </div>

                          {/* Health screening */}
                          <div>
                            <h3 className="text-foreground font-bold mb-3">
                              Health Screening
                              <span className="text-red-400 text-xs ml-2">* Please disclose all</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {HEALTH_ITEMS.map((item) => (
                                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={details[item.key] as boolean}
                                    onChange={(e) => setDetail(item.key, e.target.checked as never)}
                                    className="w-4 h-4 accent-primary"
                                  />
                                  <span className="text-muted-foreground text-sm">{item.label}</span>
                                </label>
                              ))}
                            </div>
                            <Input
                              type="text"
                              placeholder="Any other medical condition…"
                              value={details.health_other}
                              onChange={(e) => setDetail("health_other", e.target.value)}
                              className="mt-3 bg-background border-border"
                            />
                          </div>

                          {/* Goal */}
                          <div className="space-y-2">
                            <label htmlFor="primary_goal" className="text-sm font-semibold text-foreground">
                              Primary Goal
                            </label>
                            <select
                              id="primary_goal"
                              value={details.primary_goal}
                              onChange={(e) => setDetail("primary_goal", e.target.value)}
                              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="" disabled>Select…</option>
                              {GOALS.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>

                          {/* Emergency contact */}
                          <div className="border-t border-border pt-5">
                            <p className="text-sm font-semibold mb-4">Emergency Contact</p>
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                type="text"
                                placeholder="Contact name"
                                value={details.emergency_name}
                                onChange={(e) => setDetail("emergency_name", e.target.value)}
                                className="bg-background border-border"
                              />
                              <Input
                                type="tel"
                                placeholder="Contact phone"
                                value={details.emergency_phone}
                                onChange={(e) => setDetail("emergency_phone", e.target.value)}
                                className="bg-background border-border"
                              />
                            </div>
                            <Input
                              type="text"
                              placeholder="Relation (e.g. Spouse, Parent)"
                              value={details.emergency_relation}
                              onChange={(e) => setDetail("emergency_relation", e.target.value)}
                              className="mt-3 bg-background border-border"
                            />
                          </div>

                          {/* Referral */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="referral_source" className="text-sm font-semibold text-foreground">
                                How did you hear about us?
                              </label>
                              <select
                                id="referral_source"
                                value={details.referral_source}
                                onChange={(e) => setDetail("referral_source", e.target.value)}
                                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="" disabled>Select…</option>
                                {REFERRAL_SOURCES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="referral_code" className="text-sm font-semibold text-foreground">
                                Referral Code (Optional)
                              </label>
                              <Input
                                id="referral_code"
                                type="text"
                                placeholder="e.g. FRIEND10"
                                value={details.referral_code}
                                onChange={(e) => setDetail("referral_code", e.target.value)}
                                className="bg-background border-border"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={details.first_time}
                              onChange={(e) => setDetail("first_time", e.target.checked)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm text-foreground">This is my first visit</span>
                          </label>

                          {/* Consent */}
                          <div className="bg-muted/40 border border-border rounded-xl p-4">
                            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                              I confirm that the information provided is accurate. I understand that
                              cold plunge, sauna, and contrast therapy involve exposure to extreme
                              temperatures and may not be suitable for everyone. I voluntarily
                              participate and accept responsibility for any risks associated.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={details.consent_accepted}
                                onChange={(e) => setDetail("consent_accepted", e.target.checked)}
                                className="w-4 h-4 accent-primary"
                              />
                              <span className="text-foreground text-sm font-medium">
                                I agree to the Terms &amp; Conditions and Liability Waiver
                              </span>
                            </label>
                          </div>

                          {submitError && (
                            <p className="text-red-400 text-sm text-center">{submitError}</p>
                          )}

                          <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                            disabled={!detailsValid || submitting}
                          >
                            {submitting ? "Sending…" : "Send Booking Request via WhatsApp"}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            WhatsApp opens with your booking details pre-filled — our team will confirm
                            the slot and share payment details.
                          </p>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Success */}
                {step === "success" && (
                  <div className="max-w-md mx-auto text-center py-12">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-foreground text-2xl font-display font-bold mb-2">
                      Request Sent!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Your booking request has been sent to our team via WhatsApp.
                      <br />
                      We&apos;ll confirm your slot and share payment details shortly.
                    </p>
                    <Card className="bg-card border-border text-left mb-6">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service</span>
                          <span className="text-foreground font-bold">{selectedService?.name}</span>
                        </div>
                        {selectedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span className="text-foreground font-bold">
                              {format(selectedDate, "EEEE, dd MMMM yyyy")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="text-foreground font-bold">{selectedTimeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="text-primary font-bold">
                            {selectedService?.priceDisplay}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <p className="text-muted-foreground text-xs mb-4">
                      💬 Didn&apos;t open WhatsApp?
                    </p>
                    <a
                      href={`https://wa.me/${ADMIN_WA}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      Open WhatsApp
                    </a>
                    <div className="mt-4">
                      <Button type="button" onClick={handleBookAnother} variant="outline">
                        Book Another Session
                      </Button>
                    </div>
                  </div>
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
