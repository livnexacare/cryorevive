import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { format, addHours, addDays, isBefore } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle,
  Snowflake,
  Flame,
  Repeat,
  Thermometer,
  Activity,
  Sparkles,
  Loader2,
  ArrowLeft,
  Droplet,
  Hand,
  Stethoscope,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { SERVICES, getService } from "@/lib/services";
import { fetchLivePrices, getServicePrice, formatPrice, type ServicePrice } from "@/lib/pricing";
const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "918595850920";

const CENTRE_ICONS: Record<string, typeof Snowflake> = {
  ice_bath: Snowflake,
  steam_sauna: Flame,
  contrast_therapy: Repeat,
  cryo_chamber: Thermometer,
  compression_therapy: Activity,
  full_body_recovery: Sparkles,
  cupping_therapy: Droplet,
  deep_tissue_massage: Hand,
  physiotherapy: Stethoscope,
};

interface BookingDetails {
  full_name: string;
  mobile: string;
  email: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  health_high_bp: boolean;
  health_heart: boolean;
  health_asthma: boolean;
  health_seizures: boolean;
  health_diabetes: boolean;
  health_pregnancy: boolean;
  health_other: string;
  consent: boolean;
}

const EMPTY_DETAILS: BookingDetails = {
  full_name: "",
  mobile: "+91 ",
  email: "",
  age: "",
  gender: "",
  health_high_bp: false,
  health_heart: false,
  health_asthma: false,
  health_seizures: false,
  health_diabetes: false,
  health_pregnancy: false,
  health_other: "",
  consent: false,
};

const HEALTH_ITEMS: Array<{ key: keyof BookingDetails; label: string }> = [
  { key: "health_high_bp", label: "High Blood Pressure" },
  { key: "health_seizures", label: "Seizures" },
  { key: "health_heart", label: "Heart Condition" },
  { key: "health_diabetes", label: "Diabetes" },
  { key: "health_asthma", label: "Asthma" },
  { key: "health_pregnancy", label: "Pregnancy" },
];

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

  // In-centre wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [livePrices, setLivePrices] = useState<ServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState<BookingDetails>(EMPTY_DETAILS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wizardError, setWizardError] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sentBooking, setSentBooking] = useState<{
    serviceName: string;
    date: string;
    timeSlot: string;
    amount: number;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);

  const minCentreDateStr = format(new Date(), "yyyy-MM-dd");
  const maxCentreDateStr = format(addDays(new Date(), 90), "yyyy-MM-dd");
  const centreServices = SERVICES.filter((s) => s.serviceType !== "mobile_unit");
  const selectedServicePrices = selectedServices
    .map((s) => getServicePrice(livePrices, s))
    .filter((p): p is ServicePrice => Boolean(p));
  const selectedTotalPrice = selectedServicePrices.reduce((sum, p) => sum + p.price, 0);
  const finalTotalPrice = appliedCoupon ? appliedCoupon.final_amount : selectedTotalPrice;
  const toggleService = (serviceType: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceType) ? prev.filter((s) => s !== serviceType) : [...prev, serviceType]
    );
  };

  useEffect(() => {
    fetchLivePrices()
      .then(setLivePrices)
      .finally(() => setPricesLoading(false));
  }, []);

  const primaryService = selectedServices[0];

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !primaryService) return;
    setSlotsLoading(true);
    setSelectedTimeSlot("");
    try {
      const res = await fetch(
        `${API_URL}/api/slots?date=${selectedDate}&service_type=${primaryService}`
      );
      const data = await res.json();
      setAvailableSlots(res.ok ? data.available_slots ?? [] : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, primaryService]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [selectedServices]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || selectedTotalPrice <= 0) return;
    setCouponValidating(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), order_value: selectedTotalPrice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.detail || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discount_amount: data.discount_amount,
        final_amount: data.final_amount,
      });
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const formatSlotLabel = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, "h:mm a");
  };

  const canSubmit =
    details.full_name.trim().length > 1 &&
    details.mobile.replace("+91", "").trim().length >= 10 &&
    details.consent;

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedServices([]);
    setSelectedDate("");
    setSelectedTimeSlot("");
    setDetails(EMPTY_DETAILS);
    setWizardError("");
    setRequestSent(false);
    setSentBooking(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || selectedServicePrices.length === 0) return;
    setWizardError("");
    setIsProcessing(true);

    const healthConditions = [
      details.health_high_bp && "High BP",
      details.health_heart && "Heart Condition",
      details.health_asthma && "Asthma",
      details.health_seizures && "Seizures",
      details.health_diabetes && "Diabetes",
      details.health_pregnancy && "Pregnancy",
      details.health_other,
    ]
      .filter(Boolean)
      .join(", ");

    const serviceNames = selectedServices
      .map((s) => getService(s)?.name ?? s)
      .join(" + ");

    // Save to backend in the background — WhatsApp is the primary confirmation path.
    const notes = [
      selectedServices.length > 1 && `Combined booking with: ${serviceNames}`,
      details.age && `Age: ${details.age}`,
      details.gender && `Gender: ${details.gender}`,
      healthConditions && `Health: ${healthConditions}`,
      appliedCoupon && `Coupon: ${appliedCoupon.code} (-${formatPrice(appliedCoupon.discount_amount)})`,
    ]
      .filter(Boolean)
      .join(" | ");

    const savePromises = selectedServices.map((serviceType) =>
      fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: details.full_name.trim(),
          email: details.email.trim() || `${details.mobile.replace(/\s+/g, "")}@whatsapp.booking`,
          phone: details.mobile.trim(),
          service_type: serviceType,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          amount: getServicePrice(livePrices, serviceType)?.price ?? 0,
          notes,
        }),
      }).catch(() => {})
    );
    Promise.allSettled(savePromises);

    if (appliedCoupon) {
      fetch(`${API_URL}/api/coupons/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCoupon.code, order_value: selectedTotalPrice }),
      }).catch(() => {});
    }

    const message = [
      `🧊 *New CryoRevive Booking Request*`,
      ``,
      `*Service${selectedServices.length > 1 ? "s" : ""}:* ${serviceNames}`,
      `*Date:* ${format(new Date(selectedDate + "T00:00:00"), "EEEE, dd MMMM yyyy")}`,
      `*Time:* ${formatSlotLabel(selectedTimeSlot)}`,
      appliedCoupon
        ? `*${selectedServices.length > 1 ? "Total Price" : "Price"}:* ~${formatPrice(selectedTotalPrice)}~ ${formatPrice(finalTotalPrice)} (Coupon ${appliedCoupon.code} applied, -${formatPrice(appliedCoupon.discount_amount)})`
        : `*${selectedServices.length > 1 ? "Total Price" : "Price"}:* ${formatPrice(selectedTotalPrice)}`,
      ``,
      `*Name:* ${details.full_name}`,
      `*WhatsApp:* ${details.mobile}`,
      details.email && `*Email:* ${details.email}`,
      details.age && `*Age:* ${details.age}`,
      details.gender && `*Gender:* ${details.gender}`,
      healthConditions && `*Health Notes:* ${healthConditions}`,
      ``,
      `_Please confirm the slot and share payment details._`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");

    setSentBooking({
      serviceName: serviceNames,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      amount: finalTotalPrice,
    });
    setRequestSent(true);
    setIsProcessing(false);

    setTimeout(() => {
      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`, "_blank");
    }, 500);
  };

  useEffect(() => {
    const { tab, service } = router.query;
    if (tab === "event") {
      setActiveTab("event");
    }
    if (typeof service === "string" && getService(service)) {
      setSelectedServices([service]);
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
              <div className="max-w-2xl mx-auto">
                {requestSent && sentBooking ? (
                  <Card className="bg-card border-border">
                    <CardContent className="py-12 px-6 text-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-display font-bold mb-2">Request Sent!</h2>
                      <p className="text-muted-foreground mb-6">
                        Your booking request has been sent to our team via WhatsApp. We&apos;ll
                        confirm your slot and share payment details shortly.
                      </p>
                      <div className="bg-muted/40 rounded-2xl p-6 text-left mb-6 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-bold">{sentBooking.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-bold">
                            {format(new Date(sentBooking.date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-bold">{formatSlotLabel(sentBooking.timeSlot)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-border">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-bold text-primary">{formatPrice(sentBooking.amount)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">Didn&apos;t open WhatsApp?</p>
                      <Button
                        type="button"
                        className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                        onClick={() =>
                          window.open(`https://wa.me/${ADMIN_WA}`, "_blank")
                        }
                      >
                        Open WhatsApp
                      </Button>
                      <div>
                        <Button type="button" variant="ghost" className="mt-3" onClick={resetWizard}>
                          Book Another Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 sm:p-8">
                      {/* Step indicator */}
                      <div className="flex items-center mb-8">
                        {["Service", "Date & Time", "Details"].map((label, i) => (
                          <div key={label} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  wizardStep > i + 1
                                    ? "bg-primary text-primary-foreground"
                                    : wizardStep === i + 1
                                    ? "border-2 border-primary text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {wizardStep > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
                              </div>
                              <span className="hidden sm:block text-[11px] text-muted-foreground whitespace-nowrap">
                                {label}
                              </span>
                            </div>
                            {i < 2 && (
                              <div
                                className={`flex-1 h-0.5 mx-2 ${
                                  wizardStep > i + 1 ? "bg-primary" : "bg-muted"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {wizardError && (
                        <div className="mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                          {wizardError}
                        </div>
                      )}

                      {/* Step 1 — Select Service */}
                      {wizardStep === 1 && (
                        <div className="space-y-6">
                          <h2 className="text-xl font-display font-bold">Select a Service</h2>
                          {pricesLoading ? (
                            <div className="flex justify-center py-12">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {centreServices.map((service) => {
                                const Icon = CENTRE_ICONS[service.serviceType] ?? Snowflake;
                                const live = getServicePrice(livePrices, service.serviceType);
                                if (!live) return null;
                                const isSelected = selectedServices.includes(service.serviceType);
                                return (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => toggleService(service.serviceType)}
                                    className={`relative p-4 border-2 rounded-sm text-left transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                                      </div>
                                    )}
                                    <Icon
                                      className={`h-7 w-7 mb-2 ${
                                        isSelected ? "text-primary" : "text-muted-foreground"
                                      }`}
                                    />
                                    <h3 className="font-display font-bold pr-6">{service.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">{live.duration}</p>
                                    <p className="text-lg font-bold text-primary">{formatPrice(live.price)}</p>
                                  </button>
                                );
                              })}
                              {selectedServices.length > 0 && (
                                <div className="col-span-full bg-primary/5 border border-primary/30 rounded-sm p-3 flex items-center justify-between">
                                  <span className="text-sm font-semibold">
                                    {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} selected
                                  </span>
                                  <span className="font-bold text-primary">
                                    Total: {formatPrice(selectedTotalPrice)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            disabled={selectedServices.length === 0}
                            onClick={() => setWizardStep(2)}
                          >
                            Continue
                          </Button>
                        </div>
                      )}

                      {/* Step 2 — Date & Time */}
                      {wizardStep === 2 && (
                        <div className="space-y-6">
                          <h2 className="text-xl font-display font-bold">Select Date &amp; Time</h2>
                          <div className="space-y-2">
                            <Label htmlFor="centreDate">Session Date *</Label>
                            <Input
                              id="centreDate"
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              min={minCentreDateStr}
                              max={maxCentreDateStr}
                              className="bg-background border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Available Time Slots *</Label>
                            {!selectedDate ? (
                              <p className="text-sm text-muted-foreground">Pick a date to see available slots.</p>
                            ) : slotsLoading ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : availableSlots.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No slots available on this date. Please try another date.
                              </p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {availableSlots.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`py-2 px-2 rounded-sm border text-sm font-semibold transition-colors ${
                                      selectedTimeSlot === slot
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    {formatSlotLabel(slot)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setWizardStep(1)}>
                              <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                            <Button
                              type="button"
                              size="lg"
                              className="flex-1"
                              disabled={!selectedDate || !selectedTimeSlot}
                              onClick={() => setWizardStep(3)}
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 3 — Your Details */}
                      {wizardStep === 3 && (
                        <div className="space-y-6">
                          <h2 className="text-xl font-display font-bold">Your Details</h2>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name *</Label>
                              <Input
                                id="fullName"
                                value={details.full_name}
                                onChange={(e) => setDetails((p) => ({ ...p, full_name: e.target.value }))}
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="mobile">WhatsApp Number *</Label>
                                <Input
                                  id="mobile"
                                  type="tel"
                                  value={details.mobile}
                                  onChange={(e) => setDetails((p) => ({ ...p, mobile: e.target.value }))}
                                  className="bg-background border-border"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="detailsEmail">Email (Optional)</Label>
                                <Input
                                  id="detailsEmail"
                                  type="email"
                                  value={details.email}
                                  onChange={(e) => setDetails((p) => ({ ...p, email: e.target.value }))}
                                  className="bg-background border-border"
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="age">Age (Optional)</Label>
                                <Input
                                  id="age"
                                  type="number"
                                  min="1"
                                  value={details.age}
                                  onChange={(e) => setDetails((p) => ({ ...p, age: e.target.value }))}
                                  className="bg-background border-border"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Gender (Optional)</Label>
                                <RadioGroup
                                  className="flex gap-4 pt-2"
                                  value={details.gender}
                                  onValueChange={(v) =>
                                    setDetails((p) => ({ ...p, gender: v as BookingDetails["gender"] }))
                                  }
                                >
                                  {["Male", "Female", "Other"].map((g) => (
                                    <div key={g} className="flex items-center gap-2">
                                      <RadioGroupItem value={g} id={`gender-${g}`} />
                                      <Label htmlFor={`gender-${g}`} className="font-normal cursor-pointer">
                                        {g}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>
                          </div>

                          {/* Coupon code + price summary */}
                          <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                            <Label htmlFor="couponCode">Have a coupon code?</Label>
                            {appliedCoupon ? (
                              <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/30 rounded-sm px-3 py-2">
                                <span className="text-sm font-semibold text-primary">
                                  {appliedCoupon.code} applied — {formatPrice(appliedCoupon.discount_amount)} off
                                </span>
                                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  id="couponCode"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  placeholder="e.g. LAUNCH20"
                                  className="bg-background border-border uppercase tracking-wide"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={!couponCode.trim() || couponValidating}
                                  onClick={handleApplyCoupon}
                                >
                                  {couponValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                </Button>
                              </div>
                            )}
                            {couponError && <p className="text-destructive text-xs">{couponError}</p>}
                            <div className="pt-2 border-t border-border space-y-1">
                              {appliedCoupon && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Subtotal</span>
                                  <span className="line-through">{formatPrice(selectedTotalPrice)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(finalTotalPrice)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Health Screening — collapsible */}
                          <details className="bg-muted/40 border border-border rounded-xl group">
                            <summary className="p-4 cursor-pointer font-bold text-sm list-none flex items-center justify-between">
                              <span>⚕️ Health Screening (tap to expand)</span>
                              <span className="text-muted-foreground text-xs font-normal">
                                Please disclose all
                              </span>
                            </summary>
                            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                              {HEALTH_ITEMS.map((item) => (
                                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={details[item.key] as boolean}
                                    onCheckedChange={(checked) =>
                                      setDetails((p) => ({ ...p, [item.key]: checked === true }))
                                    }
                                  />
                                  <span className="text-sm text-muted-foreground">{item.label}</span>
                                </label>
                              ))}
                              <Input
                                placeholder="Any other medical condition…"
                                value={details.health_other}
                                onChange={(e) => setDetails((p) => ({ ...p, health_other: e.target.value }))}
                                className="col-span-2 bg-background border-border"
                              />
                            </div>
                          </details>

                          {/* Consent */}
                          <div className="bg-muted/40 border border-border rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <Checkbox
                                className="mt-0.5"
                                checked={details.consent}
                                onCheckedChange={(checked) =>
                                  setDetails((p) => ({ ...p, consent: checked === true }))
                                }
                              />
                              <span className="text-muted-foreground text-xs leading-relaxed">
                                I confirm the information is accurate. I understand cold plunge, sauna, and
                                contrast therapy involve exposure to extreme temperatures and may not be
                                suitable for everyone. I voluntarily participate and accept responsibility
                                for any associated risks.
                              </span>
                            </label>
                          </div>

                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setWizardStep(2)}>
                              <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                            <Button
                              type="button"
                              size="lg"
                              className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white"
                              disabled={!canSubmit || isProcessing}
                              onClick={handleSubmit}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  Send Booking Request via WhatsApp
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
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
                                  placeholder="+91 85958 50920"
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
