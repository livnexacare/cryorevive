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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
};

const GOALS = ["Recovery", "Muscle Soreness", "Fat Loss", "Injury Rehab", "General Wellness", "Other"];
const REFERRAL_SOURCES = ["Friend", "Instagram", "Google", "Gym", "Event", "Other"];

interface BookingDetails {
  full_name: string;
  mobile: string;
  email: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
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
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [livePrices, setLivePrices] = useState<ServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState<BookingDetails>(EMPTY_DETAILS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wizardError, setWizardError] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    serviceName: string;
    date: string;
    timeSlot: string;
    amount: number;
    email: string;
    paymentId: string;
  } | null>(null);

  const minCentreDateStr = format(new Date(), "yyyy-MM-dd");
  const maxCentreDateStr = format(addDays(new Date(), 90), "yyyy-MM-dd");
  const centreServices = SERVICES.filter((s) => s.serviceType !== "mobile_unit");
  const selectedServicePrice = getServicePrice(livePrices, selectedService);

  useEffect(() => {
    fetchLivePrices()
      .then(setLivePrices)
      .finally(() => setPricesLoading(false));
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTimeSlot("");
    try {
      const res = await fetch(
        `${API_URL}/api/slots?date=${selectedDate}&service_type=${selectedService}`
      );
      const data = await res.json();
      setAvailableSlots(res.ok ? data.available_slots ?? [] : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, selectedService]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const formatSlotLabel = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, "h:mm a");
  };

  const canContinueStep3 =
    details.full_name.trim().length > 1 &&
    details.mobile.replace("+91", "").trim().length >= 10 &&
    /\S+@\S+\.\S+/.test(details.email) &&
    Number(details.age) > 0 &&
    details.gender !== "" &&
    details.consent_accepted;

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedService("");
    setSelectedDate("");
    setSelectedTimeSlot("");
    setDetails(EMPTY_DETAILS);
    setWizardError("");
    setBookingConfirmed(false);
    setConfirmedBooking(null);
  };

  const handlePayment = async () => {
    if (!selectedServicePrice) {
      setWizardError("This service is not available for booking right now.");
      return;
    }
    setWizardError("");
    setIsProcessing(true);

    try {
      const bookingRes = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: details.full_name.trim(),
          email: details.email.trim(),
          phone: details.mobile.trim(),
          service_type: selectedService,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          notes: JSON.stringify({
            age: Number(details.age),
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
      });
      const booking = await bookingRes.json();
      if (!bookingRes.ok) {
        throw new Error(booking.detail || "Failed to create booking");
      }

      const orderRes = await fetch(`${API_URL}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: selectedServicePrice.price,
          currency: "INR",
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(order.detail || "Failed to create payment order");
      }

      if (!(window as any).Razorpay) {
        throw new Error("Payment gateway failed to load. Please refresh and try again.");
      }

      const rzp = new (window as any).Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name: "CryoRevive",
        description: `${getService(selectedService)?.name ?? "Recovery Session"} — ${format(
          new Date(selectedDate + "T00:00:00"),
          "dd MMM yyyy"
        )} ${formatSlotLabel(selectedTimeSlot)}`,
        prefill: {
          name: details.full_name,
          email: details.email,
          contact: details.mobile,
        },
        theme: { color: "#06b6d4" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verify = await verifyRes.json();

            if (verify.success) {
              setBookingConfirmed(true);
              setConfirmedBooking({
                serviceName: getService(selectedService)?.name ?? selectedService,
                date: selectedDate,
                timeSlot: selectedTimeSlot,
                amount: selectedServicePrice.price,
                email: details.email,
                paymentId: response.razorpay_payment_id,
              });

              const msg = encodeURIComponent(
                `✅ Payment confirmed!\n\n` +
                  `Booking: ${getService(selectedService)?.name}\n` +
                  `Date: ${format(new Date(selectedDate + "T00:00:00"), "dd MMM yyyy")}\n` +
                  `Time: ${formatSlotLabel(selectedTimeSlot)}\n` +
                  `Name: ${details.full_name}\n` +
                  `Payment ID: ${response.razorpay_payment_id}`
              );
              setTimeout(() => {
                window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, "_blank");
              }, 1500);
            } else {
              setWizardError("Payment verification failed. Please contact support.");
            }
          } catch {
            setWizardError("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            fetch(`${API_URL}/api/bookings/${booking.id}/cancel-unpaid`, {
              method: "POST",
            }).catch(() => {});
          },
        },
      });
      rzp.open();
    } catch (err: any) {
      setWizardError(err.message || "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const { tab, service } = router.query;
    if (tab === "event") {
      setActiveTab("event");
    }
    if (typeof service === "string" && getService(service)) {
      setSelectedService(service);
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
              <div className="max-w-2xl mx-auto">
                {bookingConfirmed && confirmedBooking ? (
                  <Card className="bg-card border-border">
                    <CardContent className="py-12 px-6 text-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-display font-bold mb-2">Booking Confirmed!</h2>
                      <p className="text-muted-foreground mb-6">
                        Payment successful. See you at the studio!
                      </p>
                      <div className="bg-muted/40 rounded-2xl p-6 text-left mb-6 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-bold">{confirmedBooking.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-bold">
                            {format(new Date(confirmedBooking.date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-bold">{formatSlotLabel(confirmedBooking.timeSlot)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-border">
                          <span className="text-muted-foreground">Payment</span>
                          <span className="font-bold text-primary">
                            {formatPrice(confirmedBooking.amount)} Paid
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        Confirmation sent to {confirmedBooking.email}
                      </p>
                      <Button type="button" variant="outline" onClick={resetWizard}>
                        Book Another Session
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 sm:p-8">
                      {/* Step indicator */}
                      <div className="flex items-center mb-8">
                        {["Service", "Date & Time", "Details", "Pay"].map((label, i) => (
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
                            {i < 3 && (
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
                                return (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setSelectedService(service.serviceType)}
                                    className={`p-4 border-2 rounded-sm text-left transition-all ${
                                      selectedService === service.serviceType
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <Icon
                                      className={`h-7 w-7 mb-2 ${
                                        selectedService === service.serviceType
                                          ? "text-primary"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                    <h3 className="font-display font-bold">{service.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">{live.duration}</p>
                                    <p className="text-lg font-bold text-primary">{formatPrice(live.price)}</p>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            disabled={!selectedService}
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
                                <Label htmlFor="mobile">Mobile Number *</Label>
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
                                <Label htmlFor="detailsEmail">Email *</Label>
                                <Input
                                  id="detailsEmail"
                                  type="email"
                                  value={details.email}
                                  onChange={(e) => setDetails((p) => ({ ...p, email: e.target.value }))}
                                  className="bg-background border-border"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="age">Age *</Label>
                                <Input
                                  id="age"
                                  type="number"
                                  min="1"
                                  value={details.age}
                                  onChange={(e) => setDetails((p) => ({ ...p, age: e.target.value }))}
                                  className="bg-background border-border"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Gender *</Label>
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
                            <div className="space-y-2">
                              <Label htmlFor="address">Address (Optional)</Label>
                              <Input
                                id="address"
                                value={details.address}
                                onChange={(e) => setDetails((p) => ({ ...p, address: e.target.value }))}
                                className="bg-background border-border"
                              />
                            </div>
                          </div>

                          {/* Health Screening */}
                          <div>
                            <h3 className="font-bold mb-3">
                              Health Screening
                              <span className="text-destructive text-xs ml-2 font-normal">
                                Please disclose all
                              </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
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
                            </div>
                            <Input
                              placeholder="Any other medical condition…"
                              value={details.health_other}
                              onChange={(e) => setDetails((p) => ({ ...p, health_other: e.target.value }))}
                              className="mt-3 bg-background border-border"
                            />
                          </div>

                          {/* Goal */}
                          <div className="space-y-2">
                            <Label>Primary Goal</Label>
                            <Select
                              value={details.primary_goal}
                              onValueChange={(v) => setDetails((p) => ({ ...p, primary_goal: v }))}
                            >
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select a goal" />
                              </SelectTrigger>
                              <SelectContent>
                                {GOALS.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Emergency Contact */}
                          <div>
                            <h3 className="font-bold mb-3">Emergency Contact</h3>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <Input
                                placeholder="Name"
                                value={details.emergency_name}
                                onChange={(e) => setDetails((p) => ({ ...p, emergency_name: e.target.value }))}
                                className="bg-background border-border"
                              />
                              <Input
                                placeholder="Phone"
                                value={details.emergency_phone}
                                onChange={(e) => setDetails((p) => ({ ...p, emergency_phone: e.target.value }))}
                                className="bg-background border-border"
                              />
                              <Input
                                placeholder="Relation"
                                value={details.emergency_relation}
                                onChange={(e) =>
                                  setDetails((p) => ({ ...p, emergency_relation: e.target.value }))
                                }
                                className="bg-background border-border"
                              />
                            </div>
                          </div>

                          {/* Referral */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>How did you hear about us?</Label>
                              <Select
                                value={details.referral_source}
                                onValueChange={(v) => setDetails((p) => ({ ...p, referral_source: v }))}
                              >
                                <SelectTrigger className="bg-background border-border">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REFERRAL_SOURCES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                              <Input
                                id="referralCode"
                                value={details.referral_code}
                                onChange={(e) => setDetails((p) => ({ ...p, referral_code: e.target.value }))}
                                className="bg-background border-border"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={details.first_time}
                              onCheckedChange={(checked) =>
                                setDetails((p) => ({ ...p, first_time: checked === true }))
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              This is my first time at CryoRevive
                            </span>
                          </label>

                          {/* Consent */}
                          <div className="bg-muted/40 border border-border rounded-xl p-4">
                            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                              I confirm that the information provided is accurate. I understand that cold
                              plunge, sauna, and contrast therapy involve exposure to extreme temperatures
                              and may not be suitable for everyone. I voluntarily participate and accept
                              responsibility for any risks associated.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={details.consent_accepted}
                                onCheckedChange={(checked) =>
                                  setDetails((p) => ({ ...p, consent_accepted: checked === true }))
                                }
                              />
                              <span className="text-sm font-medium">
                                I agree to the Terms &amp; Conditions and Liability Waiver
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
                              className="flex-1"
                              disabled={!canContinueStep3}
                              onClick={() => setWizardStep(4)}
                            >
                              Continue to Payment
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 4 — Pay */}
                      {wizardStep === 4 && selectedServicePrice && (
                        <div className="space-y-6">
                          <h2 className="text-xl font-display font-bold">Review &amp; Pay</h2>
                          <div className="bg-muted/40 rounded-2xl p-6 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service</span>
                              <span className="font-bold">{getService(selectedService)?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span className="font-bold">
                                {format(new Date(selectedDate + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Time</span>
                              <span className="font-bold">{formatSlotLabel(selectedTimeSlot)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-border">
                              <span className="font-bold">Total Amount</span>
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(selectedServicePrice.price)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setWizardStep(3)}
                              disabled={isProcessing}
                            >
                              <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                            <Button
                              type="button"
                              size="lg"
                              className="flex-1"
                              disabled={isProcessing}
                              onClick={handlePayment}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                                </>
                              ) : (
                                `Pay ${formatPrice(selectedServicePrice.price)}`
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
