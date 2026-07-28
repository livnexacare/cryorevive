import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { format, addDays } from "date-fns";
import {
  Search, UserPlus, Calendar, Printer, LogOut, ChevronRight,
  Check, Phone, User, Heart, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { fetchLivePrices, getServicePrice, formatPrice, type ServicePrice } from "@/lib/pricing";

const STAFF_KEY = process.env.NEXT_PUBLIC_STAFF_KEY || "";

type Tab = "search" | "form" | "book" | "confirm";

interface Client {
  id?: string;
  full_name: string;
  mobile: string;
  email: string;
  age: number | "";
  gender: string;
  address: string;
  health_high_bp: boolean;
  health_heart: boolean;
  health_asthma: boolean;
  health_seizures: boolean;
  health_diabetes: boolean;
  health_pregnancy: boolean;
  health_other: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relation: string;
  referral_source: string;
  referral_code: string;
  first_time: boolean;
  total_sessions?: number;
}

const EMPTY_CLIENT: Client = {
  full_name: "", mobile: "", email: "", age: "",
  gender: "", address: "",
  health_high_bp: false, health_heart: false,
  health_asthma: false, health_seizures: false,
  health_diabetes: false, health_pregnancy: false,
  health_other: "",
  emergency_name: "", emergency_phone: "",
  emergency_relation: "",
  referral_source: "", referral_code: "",
  first_time: true,
};

const STEPS: { key: Tab; label: string; icon: typeof Search }[] = [
  { key: "search", label: "1. Find Client", icon: Search },
  { key: "form", label: "2. Fill Form", icon: User },
  { key: "book", label: "3. Book", icon: Calendar },
  { key: "confirm", label: "4. Confirm", icon: Check },
];

export default function StaffDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("search");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState<Client>(EMPTY_CLIENT);

  // Live pricing
  const [livePrices, setLivePrices] = useState<ServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Booking state
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  const selectedService = getServicePrice(livePrices, selectedServiceType);

  useEffect(() => {
    if (!sessionStorage.getItem("cryo_staff")) {
      router.push("/staff");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    fetchLivePrices().then(setLivePrices).finally(() => setPricesLoading(false));
  }, []);

  const handleSearch = async () => {
    if (searchQ.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/clients/search?q=${encodeURIComponent(searchQ.trim())}`,
        { headers: { "X-Staff-Key": STAFF_KEY } }
      );
      const data = await res.json();
      setSearchResults(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const loadClient = (c: Client) => {
    setClient(c);
    setTab("form");
    setSearchResults([]);
    setSearchQ("");
  };

  const fetchSlots = useCallback(async (date: Date, serviceType: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `${API_URL}/api/slots?date=${format(date, "yyyy-MM-dd")}&service_type=${serviceType}`
      );
      const data = await res.json();
      setAvailableSlots(res.ok ? data.available_slots ?? [] : []);
    } catch {
      setAvailableSlots([]);
    }
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (selectedServiceType && selectedDate) {
      fetchSlots(selectedDate, selectedServiceType);
      setSelectedSlot("");
    }
  }, [selectedServiceType, selectedDate, fetchSlots]);

  const formatSlotLabel = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, "h:mm a");
  };

  const handleSaveAndBook = async () => {
    if (!selectedService || !selectedSlot || !consent) {
      setError("Please complete all required fields and accept consent");
      return;
    }
    if (!client.full_name.trim() || !client.mobile.trim()) {
      setError("Client name and mobile are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const clientRes = await fetch(`${API_URL}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Staff-Key": STAFF_KEY },
        body: JSON.stringify(client),
      });
      const savedClient = await clientRes.json();
      if (!clientRes.ok) throw new Error(savedClient.detail || "Failed to save client");
      setClient((p) => ({ ...p, id: savedClient.id, total_sessions: savedClient.total_sessions }));

      const bookingRes = await fetch(`${API_URL}/api/staff/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Staff-Key": STAFF_KEY },
        body: JSON.stringify({
          client_id: savedClient.id,
          full_name: client.full_name,
          mobile: client.mobile,
          email: client.email || undefined,
          service_type: selectedService.service_type,
          date: format(selectedDate, "yyyy-MM-dd"),
          time_slot: selectedSlot,
          payment_method: paymentMethod,
        }),
      });
      const savedBooking = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(savedBooking.detail || "Failed to create booking");
      setBooking(savedBooking);
      setTab("confirm");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save booking");
    }
    setSaving(false);
  };

  const handlePrint = () => window.print();

  const handleLogout = () => {
    sessionStorage.removeItem("cryo_staff");
    router.push("/staff");
  };

  const startNewClient = () => {
    setClient(EMPTY_CLIENT);
    setConsent(false);
    setSelectedServiceType("");
    setSelectedSlot("");
    setBooking(null);
    setError("");
    setSearchResults([]);
    setSearchQ("");
    setTab("form");
  };

  if (!authChecked) return null;

  return (
    <>
      <SEO title="Staff Dashboard — CryoRevive" />

      <div className="no-print min-h-screen bg-background text-foreground">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold">CryoRevive</span>
            <span className="text-muted-foreground text-sm">Staff App</span>
          </div>
          <div className="flex items-center gap-2">
            {tab !== "search" && (
              <button
                onClick={startNewClient}
                className="px-3 py-1.5 text-xs bg-secondary rounded-lg text-secondary-foreground hover:bg-secondary/70"
              >
                New Client
              </button>
            )}
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-border bg-card/50">
          {STEPS.map((step) => (
            <button
              key={step.key}
              onClick={() => tab !== "search" && setTab(step.key)}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 -mb-px ${
                tab === step.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              <step.icon size={14} />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* ── Search ── */}
          {tab === "search" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Find or Create Client</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name or phone..."
                  className="flex-1 h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {searching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 mb-6">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => loadClient(c)}
                      className="w-full flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-foreground font-medium">{c.full_name}</p>
                        <p className="text-muted-foreground text-sm">{c.mobile}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {c.total_sessions || 0} sessions
                        </span>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={startNewClient}
                className="w-full py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                New Client
              </button>
            </div>
          )}

          {/* ── Client Form ── */}
          {tab === "form" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Client Intake Form</h2>

              <div className="bg-card rounded-lg p-5 space-y-4 border border-border">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <User size={16} /> Personal Information
                </h3>
                {[
                  { key: "full_name", label: "Full Name *", type: "text" },
                  { key: "mobile", label: "Mobile Number *", type: "tel" },
                  { key: "email", label: "Email", type: "email" },
                  { key: "address", label: "Address", type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={(client as any)[field.key]}
                      onChange={(e) => setClient((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Age</label>
                    <input
                      type="number"
                      value={client.age}
                      onChange={(e) => setClient((p) => ({ ...p, age: parseInt(e.target.value) || "" }))}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                    <select
                      value={client.gender}
                      onChange={(e) => setClient((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-5 space-y-4 border border-border">
                <h3 className="font-bold text-destructive flex items-center gap-2">
                  <Phone size={16} /> Emergency Contact
                </h3>
                {[
                  { key: "emergency_name", label: "Full Name" },
                  { key: "emergency_phone", label: "Mobile Number" },
                  { key: "emergency_relation", label: "Relationship" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(client as any)[field.key]}
                      onChange={(e) => setClient((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-bold text-accent flex items-center gap-2 mb-4">
                  <Heart size={16} /> Health Screening
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "health_high_bp", label: "High Blood Pressure" },
                    { key: "health_seizures", label: "Seizures" },
                    { key: "health_heart", label: "Heart Condition" },
                    { key: "health_diabetes", label: "Diabetes" },
                    { key: "health_asthma", label: "Asthma" },
                    { key: "health_pregnancy", label: "Pregnancy" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(client as any)[item.key]}
                        onChange={(e) => setClient((p) => ({ ...p, [item.key]: e.target.checked }))}
                        className="w-5 h-5 accent-primary rounded"
                      />
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-1">Other medical conditions</label>
                  <input
                    type="text"
                    value={client.health_other}
                    onChange={(e) => setClient((p) => ({ ...p, health_other: e.target.value }))}
                    placeholder="Any other condition..."
                    className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="font-bold mb-4">Referral Information</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["Friend & Family", "Instagram", "Google", "YouTube", "Gym", "Event"].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setClient((p) => ({ ...p, referral_source: src }))}
                      className={`py-2 text-xs rounded-lg border transition-colors ${
                        client.referral_source === src
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={client.referral_code}
                  onChange={(e) => setClient((p) => ({ ...p, referral_code: e.target.value }))}
                  placeholder="Referral code (if any)"
                  className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <span className="text-foreground text-sm">First time at CryoRevive?</span>
                <button
                  type="button"
                  onClick={() => setClient((p) => ({ ...p, first_time: !p.first_time }))}
                  className={`w-12 h-6 rounded-full transition-colors ${client.first_time ? "bg-primary" : "bg-muted"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                      client.first_time ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setTab("book")}
                disabled={!client.full_name.trim() || !client.mobile.trim()}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-lg transition-colors"
              >
                Next: Book Session →
              </button>
            </div>
          )}

          {/* ── Book Session ── */}
          {tab === "book" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Book Session</h2>

              <div>
                <h3 className="text-muted-foreground text-sm mb-3">Select Service</h3>
                {pricesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {livePrices.filter((s) => s.is_active).map((service) => (
                      <button
                        key={service.service_type}
                        type="button"
                        onClick={() => setSelectedServiceType(service.service_type)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedServiceType === service.service_type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-border/60"
                        }`}
                      >
                        <p className="text-foreground font-bold text-sm">{service.name}</p>
                        <p className="text-muted-foreground text-xs">{service.duration}</p>
                        <p className="text-primary font-bold mt-1">{formatPrice(service.price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-muted-foreground text-sm mb-3">Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((date) => (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-lg border transition-all ${
                        format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/60"
                      }`}
                    >
                      <span className="text-muted-foreground text-xs">{format(date, "EEE")}</span>
                      <span className="text-foreground font-bold">{format(date, "d")}</span>
                      <span className="text-muted-foreground text-xs">{format(date, "MMM")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedServiceType && (
                <div>
                  <h3 className="text-muted-foreground text-sm mb-3">
                    Select Time Slot
                    {loadingSlots && <span className="ml-2 text-primary">Loading...</span>}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedSlot === slot
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-border/60"
                        }`}
                      >
                        {formatSlotLabel(slot)}
                      </button>
                    ))}
                    {!loadingSlots && availableSlots.length === 0 && (
                      <p className="col-span-3 text-muted-foreground text-sm text-center py-4">
                        No slots available for this date
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-muted-foreground text-sm mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "cash", label: "Cash", desc: "Collect at counter" },
                    { key: "online", label: "Online", desc: "Payment link" },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key as "cash" | "online")}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        paymentMethod === method.key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/60"
                      }`}
                    >
                      <p className="text-foreground font-bold">{method.label}</p>
                      <p className="text-muted-foreground text-xs">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                  I confirm the information is accurate. I understand cold plunge, sauna, and
                  contrast therapy involve extreme temperatures and may not be suitable for
                  everyone. I voluntarily participate and accept responsibility for associated
                  risks.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-foreground text-sm font-medium">
                    Client agrees to Terms &amp; Liability Waiver
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveAndBook}
                disabled={saving || !selectedService || !selectedSlot || !consent}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Confirm Booking {paymentMethod === "cash" ? "(Cash)" : "(Online)"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Confirmation ── */}
          {tab === "confirm" && booking && selectedService && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={40} className="text-primary" />
                </div>
                <h2 className="text-foreground text-2xl font-bold">Booking Confirmed!</h2>
                <p className="text-muted-foreground mt-2">
                  {paymentMethod === "cash" ? "Collect payment at counter" : "Send payment link to client"}
                </p>
              </div>

              <div className="bg-card rounded-lg p-5 space-y-3 border border-border">
                {[
                  { label: "Client", value: client.full_name },
                  { label: "Mobile", value: client.mobile },
                  { label: "Service", value: selectedService.name },
                  { label: "Date", value: format(selectedDate, "EEEE, dd MMMM yyyy") },
                  { label: "Time", value: formatSlotLabel(selectedSlot) },
                  {
                    label: "Payment",
                    value:
                      paymentMethod === "cash"
                        ? `${formatPrice(selectedService.price)} Cash`
                        : "Online — pending",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                    <span className="text-foreground font-medium text-sm">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrint}
                  className="py-3 bg-secondary hover:bg-secondary/70 text-secondary-foreground font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print Form
                </button>
                <button
                  onClick={startNewClient}
                  className="py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Next Client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PRINT FORM ── */}
      {booking && selectedService && (
        <div className="print-form" style={{ display: "none" }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: "16px",
              borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "20px",
            }}
          >
            <img
              src="/ChatGPT_Image_May_16_2025_05_08_10_PM.png"
              alt="CryoRevive"
              style={{ height: "60px" }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900 }}>CryoRevive</h1>
              <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>
                ELITE RECOVERY &amp; PERFORMANCE CENTRE
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "#888" }}>Brand of Livnexa Care Pvt Ltd</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ border: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Personal Information
                </div>
                <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                  <p>Full Name: <strong>{client.full_name}</strong></p>
                  <p>Mobile: {client.mobile}</p>
                  <p>Email: {client.email || "—"}</p>
                  <p>Age: {client.age || "—"} &nbsp;&nbsp;&nbsp; Gender: {client.gender || "—"}</p>
                  <p>Address: {client.address || "—"}</p>
                </div>
              </div>

              <div style={{ border: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Health Screening
                </div>
                <div style={{ padding: "8px", fontSize: "11px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                    {[
                      ["health_high_bp", "High Blood Pressure"],
                      ["health_seizures", "Seizures"],
                      ["health_heart", "Heart Condition"],
                      ["health_diabetes", "Diabetes"],
                      ["health_asthma", "Asthma"],
                      ["health_pregnancy", "Pregnancy"],
                    ].map(([key, label]) => (
                      <p key={key} style={{ margin: "2px 0" }}>
                        [{(client as any)[key] ? "✓" : " "}] {label}
                      </p>
                    ))}
                  </div>
                  {client.health_other && <p style={{ marginTop: "4px" }}>Other: {client.health_other}</p>}
                </div>
              </div>

              <div style={{ border: "1px solid #000" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Referral Information
                </div>
                <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                  <p>Source: {client.referral_source || "—"}</p>
                  <p>Code: {client.referral_code || "—"}</p>
                  <p>First Visit: {client.first_time ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <div>
              <div style={{ border: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Emergency Contact
                </div>
                <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                  <p>Name: {client.emergency_name || "—"}</p>
                  <p>Mobile: {client.emergency_phone || "—"}</p>
                  <p>Relation: {client.emergency_relation || "—"}</p>
                </div>
              </div>

              <div style={{ border: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Service Booked
                </div>
                <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                  <p><strong>{selectedService.name}</strong></p>
                  <p>Duration: {selectedService.duration}</p>
                  <p>Date: {format(selectedDate, "dd/MM/yyyy")}</p>
                  <p>Time: {formatSlotLabel(selectedSlot)}</p>
                  <p>Price: {formatPrice(selectedService.price)}</p>
                  <p>Payment: {paymentMethod === "cash" ? "Cash — Collected" : "Online"}</p>
                </div>
              </div>

              <div style={{ border: "1px solid #000", marginBottom: "12px" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Consent &amp; Liability Waiver
                </div>
                <div style={{ padding: "8px", fontSize: "10px", lineHeight: "1.5" }}>
                  <p>
                    I confirm the information provided is accurate. I understand cold plunge, sauna,
                    and contrast therapy involve exposure to extreme temperatures. I voluntarily
                    participate and accept responsibility for any risks.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
                    <div>
                      <p style={{ fontSize: "10px" }}>Customer Signature:</p>
                      <div style={{ borderBottom: "1px solid #000", marginTop: "24px" }} />
                      <p style={{ fontSize: "10px", marginTop: "4px" }}>Date:</p>
                      <div style={{ borderBottom: "1px solid #000", marginTop: "16px" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "10px" }}>Staff Name:</p>
                      <div style={{ borderBottom: "1px solid #000", marginTop: "24px" }} />
                      <p style={{ fontSize: "10px", marginTop: "4px" }}>Staff Signature:</p>
                      <div style={{ borderBottom: "1px solid #000", marginTop: "16px" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: "2px solid #000" }}>
                <div style={{ background: "#000", color: "#fff", padding: "4px 8px", fontSize: "12px", fontWeight: 900 }}>
                  Staff Use Only
                </div>
                <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.8" }}>
                  <p>Service Price: {formatPrice(selectedService.price)}</p>
                  <p>Payment Method: {paymentMethod}</p>
                  <p>Booking ID: {booking.id?.slice(0, 8) || "—"}</p>
                  <p>Session Time: {formatSlotLabel(selectedSlot)}</p>
                  <p style={{ marginTop: "8px", fontSize: "10px" }}>Staff Name: _______________</p>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #ccc",
              display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666",
            }}
          >
            <span>📞 9891430920 | 8595850920</span>
            <span>✉ info@cryorevive.in</span>
            <span>🌐 www.cryorevive.in</span>
            <span>📍 C-168, Omnicron 1, Greater Noida, UP</span>
          </div>
        </div>
      )}
    </>
  );
}
