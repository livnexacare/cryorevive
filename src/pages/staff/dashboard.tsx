import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { format, addDays } from "date-fns";
import {
  Search, UserPlus, Calendar, Printer, LogOut, ChevronRight,
  Check, Phone, User, Heart, Loader2, Zap, CreditCard,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { fetchLivePrices, getServicePrice, formatPrice, type ServicePrice } from "@/lib/pricing";

const STAFF_KEY = process.env.NEXT_PUBLIC_STAFF_KEY || "";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";

type StaffTab = "clients" | "bookings" | "events" | "profile" | "members";

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

interface ClientMembership {
  id: string;
  package_name: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  end_date: string;
}

const STEPS: { key: Tab; label: string; icon: typeof Search }[] = [
  { key: "search", label: "1. Find Client", icon: Search },
  { key: "form", label: "2. Fill Form", icon: User },
  { key: "book", label: "3. Book", icon: Calendar },
  { key: "confirm", label: "4. Confirm", icon: Check },
];

interface StaffInfo {
  staff_id: string;
  username: string;
  full_name: string;
  role: string;
}

interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  service_type: string;
  date: string;
  time_slot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "paid" | "unpaid";
  created_at: string;
}

type BookingFilter = "all" | "pending" | "confirmed" | "cancelled";

interface PayrollRecord {
  id: string;
  pay_type: "daily" | "monthly";
  daily_wage: number | null;
  monthly_salary: number | null;
  period_start: string;
  period_end: string;
  days_worked: number;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
}

interface MembershipRecord {
  id: string;
  client_id: string;
  client_name: string;
  client_mobile: string;
  package_type: string;
  package_name: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  price_paid: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "paused" | "cancelled";
}

const MEMBERSHIP_PACKAGES: { key: string; label: string; sessions: number; price: number }[] = [
  { key: "starter", label: "Starter", sessions: 8, price: 5999 },
  { key: "athlete", label: "Athlete", sessions: 16, price: 9999 },
  { key: "elite", label: "Elite", sessions: 30, price: 15999 },
];

const MEMBERSHIP_PACKAGE_NAMES: Record<string, string> = {
  starter: "Starter", athlete: "Athlete", elite: "Elite", custom: "Custom",
};

const formatServiceLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function StaffDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [tab, setTab] = useState<Tab>("search");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState<Client>(EMPTY_CLIENT);
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(null);

  // New-client membership add-on
  const [addMembership, setAddMembership] = useState(false);
  const emptyMembershipData = {
    package_type: "starter",
    sessions_total: 8,
    price_paid: 5999,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };
  const [membershipData, setMembershipData] = useState(emptyMembershipData);
  const [membershipError, setMembershipError] = useState("");

  // Staff Members tab
  const [staffMemberships, setStaffMemberships] = useState<MembershipRecord[]>([]);
  const [staffMembershipsLoading, setStaffMembershipsLoading] = useState(false);
  const [memberSearchQ, setMemberSearchQ] = useState("");
  const [useSessionMembership, setUseSessionMembership] = useState<MembershipRecord | null>(null);
  const [useSessionServiceType, setUseSessionServiceType] = useState("");
  const [useSessionSaving, setUseSessionSaving] = useState(false);

  // Live pricing
  const [livePrices, setLivePrices] = useState<ServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Booking state
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    original_amount: 0,
    discount: 0,
    final_amount: 0,
  });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  // Top-level nav + bookings
  const [activeStaffTab, setActiveStaffTab] = useState<StaffTab>("clients");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("all");

  // My payroll
  const [myPayroll, setMyPayroll] = useState<PayrollRecord[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const selectedService = getServicePrice(livePrices, selectedServiceType);

  // Pre-fill the amount to collect from the selected service's live price.
  useEffect(() => {
    const price = getServicePrice(livePrices, selectedServiceType)?.price ?? 0;
    setPaymentDetails({ original_amount: price, discount: 0, final_amount: price });
  }, [selectedServiceType, livePrices]);

  useEffect(() => {
    if (!sessionStorage.getItem("cryo_staff")) {
      router.push("/staff");
      return;
    }
    const info = sessionStorage.getItem("cryo_staff_info");
    if (info) {
      try { setStaffInfo(JSON.parse(info)); } catch { /* ignore malformed cache */ }
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    fetchLivePrices().then(setLivePrices).finally(() => setPricesLoading(false));
  }, []);

  useEffect(() => {
    if (activeStaffTab !== "profile" || !staffInfo?.staff_id) return;
    let cancelled = false;
    setPayrollLoading(true);
    fetch(`${API_URL}/api/payroll/my?staff_id=${staffInfo.staff_id}`, { headers: { "X-Staff-Key": STAFF_KEY } })
      .then(r => r.json())
      .then((data: PayrollRecord[]) => { if (!cancelled) setMyPayroll(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMyPayroll([]); })
      .finally(() => { if (!cancelled) setPayrollLoading(false); });
    return () => { cancelled = true; };
  }, [activeStaffTab, staffInfo?.staff_id]);

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

  const checkClientMembership = async (mobile: string) => {
    if (!mobile) { setClientMembership(null); return; }
    try {
      const res = await fetch(`${API_URL}/api/memberships/client/${encodeURIComponent(mobile)}`, {
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      const data = await res.json();
      setClientMembership(data?.has_membership ? data.membership : null);
    } catch {
      setClientMembership(null);
    }
  };

  const loadClient = (c: Client) => {
    setClient(c);
    setTab("form");
    setSearchResults([]);
    setSearchQ("");
    checkClientMembership(c.mobile);
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

  const fetchStaffBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings?limit=50`, {
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      const data = await res.json();
      setBookings(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    }
    setLoadingBookings(false);
  }, []);

  useEffect(() => {
    if (activeStaffTab === "bookings" || activeStaffTab === "events" || activeStaffTab === "profile") {
      fetchStaffBookings();
    }
  }, [activeStaffTab, fetchStaffBookings]);

  const fetchStaffMemberships = useCallback(async () => {
    setStaffMembershipsLoading(true);
    try {
      const url = memberSearchQ.trim().length >= 2
        ? `${API_URL}/api/memberships/search?q=${encodeURIComponent(memberSearchQ.trim())}`
        : `${API_URL}/api/memberships`;
      const res = await fetch(url, { headers: { "X-Admin-Key": ADMIN_KEY } });
      const data = await res.json();
      setStaffMemberships(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setStaffMemberships([]);
    }
    setStaffMembershipsLoading(false);
  }, [memberSearchQ]);

  useEffect(() => {
    if (activeStaffTab === "members") fetchStaffMemberships();
  }, [activeStaffTab, fetchStaffMemberships]);

  const confirmStaffUseSession = async () => {
    if (!useSessionMembership || !useSessionServiceType) return;
    setUseSessionSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/memberships/${useSessionMembership.id}/use-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ service_type: useSessionServiceType, staff_name: staffInfo?.full_name || "Staff" }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUseSessionMembership(null);
      setUseSessionServiceType("");
      fetchStaffMemberships();
    } catch {
      alert("Failed to mark session used.");
    }
    setUseSessionSaving(false);
  };

  const filteredBookings =
    bookingFilter === "all" ? bookings : bookings.filter((b) => b.status === bookingFilter);

  const upcomingBookings = bookings
    .filter((b) => {
      const bookingDate = new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today && b.status !== "cancelled";
    })
    .sort(
      (a, b) =>
        new Date(`${a.date} ${a.time_slot}`).getTime() - new Date(`${b.date} ${b.time_slot}`).getTime()
    );

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
    setMembershipError("");

    try {
      const clientRes = await fetch(`${API_URL}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Staff-Key": STAFF_KEY },
        body: JSON.stringify(client),
      });
      const savedClient = await clientRes.json();
      if (!clientRes.ok) throw new Error(savedClient.detail || "Failed to save client");
      setClient((p) => ({ ...p, id: savedClient.id, total_sessions: savedClient.total_sessions }));

      if (addMembership && membershipData.package_type) {
        try {
          const membershipRes = await fetch(`${API_URL}/api/memberships`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
            body: JSON.stringify({
              client_id: savedClient.id,
              client_name: client.full_name,
              client_mobile: client.mobile,
              package_type: membershipData.package_type,
              package_name: MEMBERSHIP_PACKAGE_NAMES[membershipData.package_type] ?? "Custom",
              sessions_total: membershipData.sessions_total,
              price_paid: membershipData.price_paid,
              start_date: membershipData.start_date,
              end_date: membershipData.end_date,
            }),
          });
          if (!membershipRes.ok) setMembershipError("Booking saved, but the membership package could not be created.");
        } catch { setMembershipError("Booking saved, but the membership package could not be created."); }
      }

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
          amount: paymentDetails.final_amount,
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

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ status }),
      });
    } catch {
      // fetchStaffBookings below reflects actual server state either way
    }
    fetchStaffBookings();
  };

  const handlePrint = () => window.print();

  const handleLogout = () => {
    sessionStorage.removeItem("cryo_staff");
    sessionStorage.removeItem("cryo_staff_info");
    router.push("/staff");
  };

  const startNewClient = () => {
    setClient(EMPTY_CLIENT);
    setClientMembership(null);
    setAddMembership(false);
    setMembershipData(emptyMembershipData);
    setMembershipError("");
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

      <div className="no-print min-h-screen bg-background text-foreground pb-24">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold">CryoRevive</span>
            {staffInfo ? (
              <span className="text-muted-foreground text-sm">
                {staffInfo.full_name}
                <span className="text-muted-foreground/60"> · {staffInfo.role}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">Staff App</span>
            )}
          </div>
        </div>

        {activeStaffTab === "clients" && (
        <>
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

              {clientMembership && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <p className="text-primary font-bold text-sm flex items-center gap-2">
                    🎫 Active Membership: {clientMembership.package_name}
                  </p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-muted-foreground">
                      Sessions: {clientMembership.sessions_remaining}/{clientMembership.sessions_total} remaining
                    </span>
                    <span className="text-yellow-500">
                      Expires: {new Date(clientMembership.end_date).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 bg-primary rounded-full"
                      style={{ width: `${clientMembership.sessions_total > 0 ? (clientMembership.sessions_used / clientMembership.sessions_total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

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

              {!client.id && !clientMembership && (
                <div className="bg-card rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                      <CreditCard size={16} /> Add Monthly Package
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAddMembership((v) => !v)}
                      className={`w-10 h-6 rounded-full transition-colors ${addMembership ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${addMembership ? "translate-x-4" : ""}`} />
                    </button>
                  </div>

                  {addMembership && (
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        {MEMBERSHIP_PACKAGES.map((pkg) => (
                          <button
                            key={pkg.key}
                            type="button"
                            onClick={() => setMembershipData((p) => ({ ...p, package_type: pkg.key, sessions_total: pkg.sessions, price_paid: pkg.price }))}
                            className={`p-2.5 rounded-lg border text-center transition-colors ${
                              membershipData.package_type === pkg.key ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="text-foreground font-bold text-xs">{pkg.label}</p>
                            <p className="text-primary text-xs">₹{pkg.price.toLocaleString("en-IN")}</p>
                            <p className="text-muted-foreground text-xs">{pkg.sessions} sessions</p>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Sessions</label>
                          <input
                            type="number"
                            value={membershipData.sessions_total}
                            onChange={(e) => setMembershipData((p) => ({ ...p, sessions_total: parseInt(e.target.value) || 0, package_type: "custom" }))}
                            className="w-full h-10 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Price (₹)</label>
                          <input
                            type="number"
                            value={membershipData.price_paid}
                            onChange={(e) => setMembershipData((p) => ({ ...p, price_paid: parseInt(e.target.value) || 0, package_type: "custom" }))}
                            className="w-full h-10 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Start</label>
                          <input
                            type="date"
                            value={membershipData.start_date}
                            onChange={(e) => setMembershipData((p) => ({ ...p, start_date: e.target.value }))}
                            className="w-full h-10 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">End</label>
                          <input
                            type="date"
                            value={membershipData.end_date}
                            onChange={(e) => setMembershipData((p) => ({ ...p, end_date: e.target.value }))}
                            className="w-full h-10 px-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Package</span>
                          <span className="text-foreground capitalize">{membershipData.package_type}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>Sessions</span>
                          <span className="text-foreground">{membershipData.sessions_total}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-primary">₹{membershipData.price_paid.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {membershipError && <p className="text-destructive text-xs">{membershipError}</p>}

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

              {/* Payment details — amount + discount */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-foreground text-sm font-semibold mb-3">Payment Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={paymentDetails.original_amount || ""}
                      onChange={(e) => {
                        const orig = parseInt(e.target.value) || 0;
                        setPaymentDetails((p) => ({ ...p, original_amount: orig, final_amount: Math.max(0, orig - p.discount) }));
                      }}
                      placeholder="e.g. 899"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={paymentDetails.discount || ""}
                      onChange={(e) => {
                        const disc = parseInt(e.target.value) || 0;
                        setPaymentDetails((p) => ({ ...p, discount: disc, final_amount: Math.max(0, p.original_amount - disc) }));
                      }}
                      placeholder="0"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="text-muted-foreground text-sm">Amount to Collect</span>
                  <span className="text-primary font-black text-xl">₹{paymentDetails.final_amount.toLocaleString("en-IN")}</span>
                </div>
                {paymentDetails.discount > 0 && (
                  <p className="text-green-500 text-xs mt-1 text-right">
                    Discount applied: ₹{paymentDetails.discount.toLocaleString("en-IN")}
                  </p>
                )}
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
        </>
        )}

        {/* ── Bookings ── */}
        {activeStaffTab === "bookings" && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h2 className="text-lg font-bold mb-4">All Bookings</h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total", value: bookings.length, color: "text-foreground" },
                {
                  label: "Confirmed",
                  value: bookings.filter((b) => b.status === "confirmed").length,
                  color: "text-green-400",
                },
                {
                  label: "Pending",
                  value: bookings.filter((b) => b.status === "pending").length,
                  color: "text-amber-400",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl p-3 text-center border border-border">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(["all", "pending", "confirmed", "cancelled"] as BookingFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    bookingFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-muted-foreground text-xs font-mono">
                          #{b.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-foreground font-bold">{b.name}</p>
                        <p className="text-muted-foreground text-sm">{b.phone}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            b.status === "confirmed"
                              ? "bg-green-500/20 text-green-300"
                              : b.status === "cancelled"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {b.status}
                        </span>
                        <p
                          className={`text-xs mt-1 ${
                            b.payment_status === "paid" ? "text-green-400" : "text-amber-400"
                          }`}
                        >
                          {b.payment_status === "paid" ? "✅ Paid" : "⏳ Pay at venue"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Service</p>
                        <p className="text-foreground font-medium">{formatServiceLabel(b.service_type)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="text-foreground font-medium">
                          {new Date(b.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="text-foreground font-medium">{b.time_slot}</p>
                      </div>
                    </div>

                    {(staffInfo?.role === "receptionist" || staffInfo?.role === "manager") && (
                      <div className="flex gap-2 mt-3">
                        {b.status === "pending" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}
                            className="flex-1 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "cancelled")}
                            className="flex-1 py-2 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Events (upcoming) ── */}
        {activeStaffTab === "events" && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h2 className="text-lg font-bold mb-4">Upcoming Sessions</h2>

            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming sessions</p>
              </div>
            ) : (
              Object.entries(
                upcomingBookings.reduce((groups, b) => {
                  if (!groups[b.date]) groups[b.date] = [];
                  groups[b.date].push(b);
                  return groups;
                }, {} as Record<string, Booking[]>)
              ).map(([date, dayBookings]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary/20 border border-primary/30 rounded-xl px-3 py-2 text-center min-w-[60px]">
                      <p className="text-primary font-black text-lg leading-none">
                        {new Date(date).getDate()}
                      </p>
                      <p className="text-primary text-xs">
                        {new Date(date).toLocaleDateString("en-IN", { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground font-bold">
                        {new Date(date).toLocaleDateString("en-IN", { weekday: "long" })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {dayBookings.length} session{dayBookings.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                        <div className="text-center min-w-[50px]">
                          <p className="text-foreground font-bold text-sm">{b.time_slot}</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">{b.name}</p>
                          <p className="text-muted-foreground text-xs">{formatServiceLabel(b.service_type)}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            b.status === "confirmed"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Profile ── */}
        {activeStaffTab === "profile" && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            {!staffInfo ? (
              <p className="text-muted-foreground text-sm text-center py-12">Profile unavailable</p>
            ) : (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl p-6 border border-border text-center">
                  <div className="w-20 h-20 bg-primary/20 border-2 border-primary/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-black text-primary">
                      {staffInfo.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-foreground text-xl font-bold">{staffInfo.full_name}</h2>
                  <p className="text-muted-foreground text-sm">@{staffInfo.username}</p>
                  <span
                    className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
                      staffInfo.role === "manager"
                        ? "bg-purple-500/20 text-purple-300"
                        : staffInfo.role === "therapist"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {staffInfo.role.charAt(0).toUpperCase() + staffInfo.role.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-xl p-4 border border-border text-center">
                    <p className="text-2xl font-black text-primary">
                      {bookings.filter((b) => b.status === "confirmed").length}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">Confirmed Sessions</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border text-center">
                    <p className="text-2xl font-black text-green-400">{upcomingBookings.length}</p>
                    <p className="text-muted-foreground text-xs mt-1">Upcoming Sessions</p>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
                  <h3 className="text-foreground font-bold">Staff Details</h3>
                  {[
                    { label: "Full Name", value: staffInfo.full_name },
                    { label: "Username", value: `@${staffInfo.username}` },
                    { label: "Role", value: staffInfo.role },
                    { label: "Staff ID", value: staffInfo.staff_id?.slice(0, 8).toUpperCase() || "—" },
                    { label: "Studio", value: "CryoRevive — Greater Noida" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center py-2 border-b border-border/60 last:border-0"
                    >
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                      <span className="text-foreground text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="text-foreground font-bold mb-3">Today&apos;s Schedule</h3>
                  {(() => {
                    const today = new Date().toISOString().split("T")[0];
                    const todayBookings = bookings.filter((b) => b.date === today && b.status !== "cancelled");
                    return todayBookings.length > 0 ? (
                      <div className="space-y-2">
                        {todayBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex justify-between items-center text-sm py-2 border-b border-border/60 last:border-0"
                          >
                            <span className="text-foreground">{b.time_slot}</span>
                            <span className="text-muted-foreground">{formatServiceLabel(b.service_type)}</span>
                            <span className="text-primary font-medium">{b.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No sessions today</p>
                    );
                  })()}
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="text-foreground font-bold mb-3">My Payroll</h3>
                  {payrollLoading ? (
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  ) : myPayroll.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payroll records yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myPayroll.map((rec) => (
                        <div key={rec.id} className="flex justify-between items-center text-sm py-2 border-b border-border/60 last:border-0">
                          <div>
                            <p className="text-foreground font-medium">
                              {String(rec.period_start).slice(0, 10)} – {String(rec.period_end).slice(0, 10)}
                            </p>
                            <p className="text-muted-foreground text-xs">{rec.days_worked} days · {rec.pay_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-foreground font-medium">₹{rec.total_amount.toLocaleString("en-IN")}</p>
                            <p className={`text-xs ${rec.amount_pending > 0 ? "text-destructive" : "text-green-400"}`}>
                              {rec.amount_pending > 0 ? `₹${rec.amount_pending.toLocaleString("en-IN")} pending` : "Fully paid"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Members ── */}
        {activeStaffTab === "members" && (
          <div className="px-4 pt-4 pb-24">
            <h2 className="text-foreground font-bold text-lg mb-4">Members</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={memberSearchQ}
                onChange={(e) => setMemberSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchStaffMemberships()}
                placeholder="Search by name or mobile..."
                className="flex-1 h-11 px-4 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={fetchStaffMemberships}
                className="px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Search size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Active", value: staffMemberships.filter((m) => m.status === "active").length, color: "text-green-500" },
                {
                  label: "Expiring",
                  value: staffMemberships.filter((m) => {
                    const d = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return d <= 7 && d > 0 && m.status === "active";
                  }).length,
                  color: "text-yellow-500",
                },
                { label: "Total", value: staffMemberships.length, color: "text-foreground" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl p-3 border border-border text-center">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {staffMembershipsLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading members...</div>
            ) : staffMemberships.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard size={32} className="text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No members found</p>
              </div>
            ) : (
              staffMemberships.map((m) => {
                const pct = m.sessions_total > 0 ? Math.round((m.sessions_used / m.sessions_total) * 100) : 0;
                const daysLeft = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                return (
                  <div key={m.id} className={`bg-card rounded-xl border mb-3 overflow-hidden ${isExpiringSoon ? "border-yellow-500/40" : "border-border"}`}>
                    <div className={`h-1 ${m.package_type === "elite" ? "bg-purple-500" : m.package_type === "athlete" ? "bg-blue-500" : "bg-green-500"}`} />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-foreground font-bold">{m.client_name}</p>
                          <p className="text-muted-foreground text-sm">{m.client_mobile}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.package_type === "elite" ? "bg-purple-500/20 text-purple-400" :
                          m.package_type === "athlete" ? "bg-blue-500/20 text-blue-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>
                          {m.package_name}
                        </span>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 mb-3">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Sessions</p>
                        <div className="grid grid-cols-3 gap-2 text-center mb-2">
                          <div>
                            <p className="text-xl font-black text-foreground">{m.sessions_total}</p>
                            <p className="text-muted-foreground text-xs">Given</p>
                          </div>
                          <div>
                            <p className="text-xl font-black text-yellow-500">{m.sessions_used}</p>
                            <p className="text-muted-foreground text-xs">Taken</p>
                          </div>
                          <div>
                            <p className={`text-xl font-black ${m.sessions_remaining <= 0 ? "text-destructive" : m.sessions_remaining <= 3 ? "text-yellow-500" : "text-green-500"}`}>
                              {m.sessions_remaining}
                            </p>
                            <p className="text-muted-foreground text-xs">Pending</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className={`flex justify-between text-xs px-3 py-2 rounded-lg mb-3 ${
                        isExpiringSoon ? "bg-yellow-500/10 text-yellow-500" : daysLeft <= 0 ? "bg-destructive/10 text-destructive" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        <span>Expires: {new Date(m.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="font-bold">
                          {daysLeft <= 0 ? "Expired" : isExpiringSoon ? `${daysLeft}d left ⚠` : `${daysLeft} days`}
                        </span>
                      </div>

                      {m.status === "active" && m.sessions_remaining > 0 && (
                        <button
                          onClick={() => { setUseSessionMembership(m); setUseSessionServiceType(""); }}
                          className="w-full py-2.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-colors"
                        >
                          ✓ Mark Session Used
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Use-session modal ── */}
        {useSessionMembership && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={() => setUseSessionMembership(null)}>
            <div className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-foreground font-bold mb-1">Mark Session Used</h3>
              <p className="text-muted-foreground text-sm mb-3">{useSessionMembership.client_name}</p>
              <label className="block text-xs text-muted-foreground mb-1">Service Used</label>
              <select
                value={useSessionServiceType}
                onChange={(e) => setUseSessionServiceType(e.target.value)}
                className="w-full h-11 px-3 bg-background border border-input rounded-lg text-foreground text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select service...</option>
                {livePrices.map((s) => (
                  <option key={s.service_type} value={s.service_type}>{formatServiceLabel(s.service_type)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={confirmStaffUseSession}
                  disabled={!useSessionServiceType || useSessionSaving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg font-bold transition-colors"
                >
                  {useSessionSaving ? "Saving..." : "Confirm"}
                </button>
                <button
                  onClick={() => setUseSessionMembership(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom nav ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-10 no-print safe-area-inset-bottom">
          {(
            [
              { key: "clients", label: "Clients", icon: UserPlus },
              { key: "bookings", label: "Bookings", icon: Calendar },
              { key: "events", label: "Events", icon: Zap },
              { key: "members", label: "Members", icon: CreditCard },
              { key: "profile", label: "Profile", icon: User },
            ] as { key: StaffTab; label: string; icon: typeof UserPlus }[]
          ).map((navTab) => (
            <button
              key={navTab.key}
              onClick={() => setActiveStaffTab(navTab.key)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors min-h-[60px] ${
                activeStaffTab === navTab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <navTab.icon size={22} />
              <span className="text-[10px] sm:text-xs font-medium">{navTab.label}</span>
            </button>
          ))}
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
