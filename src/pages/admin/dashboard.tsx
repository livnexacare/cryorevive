import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, Calendar, TrendingUp, CheckCircle2, Clock, Bell, DollarSign, Trash2, Pencil, X, Copy, MessageCircle, RefreshCw, Upload } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";
const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "918595850920";

const SERVICE_LABELS: Record<string, string> = {
  ice_bath: "Ice Bath",
  steam_sauna: "Steam Sauna",
  contrast_therapy: "Contrast Therapy",
  cryo_chamber: "Cryo Chamber",
  mobile_unit: "Mobile Unit",
};

type BookingStatus = "pending" | "confirmed" | "cancelled";
type DashTab = "bookings" | "announcements" | "pricing";
type AnnouncementType = "general" | "offer" | "feature" | "event";
type EventType = "marathon" | "corporate" | "sports" | "school" | "military" | "custom";

// ── TypeScript interfaces ────────────────────────────────────────────────────

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_type: string;
  date: string;
  time_slot: string;
  notes: string;
  status: BookingStatus;
  payment_status: "unpaid" | "paid";
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  url: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  cta_type?: string | null;
}

interface ServicePrice {
  id: string;
  service_type: string;
  name: string;
  duration: string;
  price: number;
  is_active: boolean;
  updated_at: string;
}

interface EventPricing {
  id: string;
  name: string;
  event_type: EventType;
  min_athletes: number;
  max_athletes: number;
  base_price: number;
  price_per_athlete: number;
  gst_percent: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface PriceCalculation {
  base_price: number;
  per_athlete_cost: number;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total: number;
  per_person: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;

const ANN_TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "offer", label: "Offer" },
  { value: "feature", label: "Feature Update" },
  { value: "event", label: "Event" },
];

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "marathon", label: "Marathon / Running Event" },
  { value: "corporate", label: "Corporate Wellness" },
  { value: "sports", label: "Sports Team / Meet" },
  { value: "school", label: "School / College" },
  { value: "military", label: "Military / Defence" },
  { value: "custom", label: "Custom" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<DashTab>("bookings");

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState("");
  const [annTick, setAnnTick] = useState(0);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annType, setAnnType] = useState<AnnouncementType>("general");
  const [annExpiresAt, setAnnExpiresAt] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState("");
  const [postError, setPostError] = useState("");
  const [sendLoading, setSendLoading] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<Record<string, string>>({});
  const [deactivateLoading, setDeactivateLoading] = useState<string | null>(null);

  // Image upload state
  const [annImagePreview, setAnnImagePreview] = useState<string>("");
  const [annImageUrl, setAnnImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // CTA state
  const [annCtaLabel, setAnnCtaLabel] = useState<string>("");
  const [annCtaUrl, setAnnCtaUrl] = useState<string>("");
  const [annCtaType, setAnnCtaType] = useState<string>("link");

  // Pricing state
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceEdits, setPriceEdits] = useState<Record<string, { price: string; duration: string; is_active: boolean }>>({});
  const [priceSaving, setPriceSaving] = useState<string | null>(null);
  const [priceSaveResult, setPriceSaveResult] = useState<Record<string, string>>({});
  const [eventTiers, setEventTiers] = useState<EventPricing[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [tiersTick, setTiersTick] = useState(0);
  const [deletingTier, setDeletingTier] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [showCreateTier, setShowCreateTier] = useState(false);

  // Calculator state
  const [calcAthletes, setCalcAthletes] = useState(50);
  const [calcTierId, setCalcTierId] = useState("");
  const [calcResult, setCalcResult] = useState<PriceCalculation | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // New tier form
  const emptyTierForm = {
    name: "", event_type: "marathon" as EventType,
    min_athletes: "", max_athletes: "", base_price: "", price_per_athlete: "",
    gst_percent: "18", description: "", is_active: true,
  };
  const [tierForm, setTierForm] = useState(emptyTierForm);
  const [tierFormLoading, setTierFormLoading] = useState(false);
  const [tierFormError, setTierFormError] = useState("");

  // ── Auth ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const auth = sessionStorage.getItem("cryo_admin");
    if (auth !== "true") { router.push("/admin"); return; }
    setIsAuthenticated(true);
  }, [router]);

  // ── Auto-refresh bookings every 30s ────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ── Fetch bookings ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);
    fetch(`${API_URL}/api/bookings?${params}`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then((data: Booking[]) => { if (!cancelled) setBookings(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, statusFilter, dateFilter, tick]);

  // ── Fetch announcements ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setAnnLoading(true);
    setAnnError("");
    fetch(`${API_URL}/api/notifications/announcements`)
      .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then((data: Announcement[]) => { if (!cancelled) setAnnouncements(data); })
      .catch((e: Error) => { if (!cancelled) setAnnError(e.message); })
      .finally(() => { if (!cancelled) setAnnLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, annTick]);

  // ── Fetch service prices ────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "pricing") return;
    let cancelled = false;
    setPriceLoading(true);
    fetch(`${API_URL}/api/pricing/services`)
      .then(r => r.json())
      .then((data: ServicePrice[]) => {
        if (cancelled) return;
        setServicePrices(data);
        const edits: Record<string, { price: string; duration: string; is_active: boolean }> = {};
        data.forEach(s => { edits[s.service_type] = { price: String(s.price), duration: s.duration, is_active: s.is_active }; });
        setPriceEdits(edits);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPriceLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab]);

  // ── Fetch event tiers ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "pricing") return;
    let cancelled = false;
    setTiersLoading(true);
    fetch(`${API_URL}/api/pricing/events`)
      .then(r => r.json())
      .then((data: EventPricing[]) => { if (!cancelled) setEventTiers(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTiersLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, tiersTick]);

  // ── Calculator ──────────────────────────────────────────────────────────

  const runCalc = useCallback(() => {
    const tier = eventTiers.find(t => t.id === calcTierId);
    if (!tier || !calcAthletes) { setCalcResult(null); return; }
    const subtotal = tier.base_price + calcAthletes * tier.price_per_athlete;
    const gst_amount = Math.round(subtotal * tier.gst_percent / 100);
    const total = subtotal + gst_amount;
    setCalcResult({
      base_price: tier.base_price,
      per_athlete_cost: calcAthletes * tier.price_per_athlete,
      subtotal,
      gst_percent: tier.gst_percent,
      gst_amount,
      total,
      per_person: calcAthletes > 0 ? Math.round(total / calcAthletes) : 0,
    });
  }, [calcTierId, calcAthletes, eventTiers]);

  useEffect(() => { runCalc(); }, [runCalc]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: BookingStatus) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setTick(t => t + 1);
    } catch { alert("Failed to update booking status. Please try again."); }
    finally { setActionLoading(null); }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    if (uploadingImage) { setPostError("Please wait for image to finish uploading"); return; }
    setPostLoading(true); setPostSuccess(""); setPostError("");
    try {
      const res = await fetch(`${API_URL}/api/notifications/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          title: annTitle.trim(),
          body: annBody.trim(),
          type: annType,
          expires_at: annExpiresAt || null,
          image_url: annImageUrl || null,
          cta_label: annCtaLabel || null,
          cta_url: annCtaUrl || null,
          cta_type: annCtaType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setPostSuccess("Announcement posted!");
      setAnnTitle(""); setAnnBody(""); setAnnType("general"); setAnnExpiresAt("");
      setAnnImagePreview(""); setAnnImageUrl("");
      setAnnCtaLabel(""); setAnnCtaUrl(""); setAnnCtaType("link");
      setAnnTick(t => t + 1);
    } catch (e: unknown) { setPostError(e instanceof Error ? e.message : "Failed to post"); }
    finally { setPostLoading(false); }
  };

  const sendPush = async (id: string) => {
    setSendLoading(id); setSendResult(r => ({ ...r, [id]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ announcement_id: id }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as { pushed: number };
      setSendResult(r => ({ ...r, [id]: `Sent to ${data.pushed} device${data.pushed !== 1 ? "s" : ""}` }));
    } catch (e: unknown) {
      setSendResult(r => ({ ...r, [id]: e instanceof Error ? e.message : "Failed" }));
    } finally { setSendLoading(null); }
  };

  const deactivate = async (id: string) => {
    setDeactivateLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/notifications/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch { alert("Failed to deactivate announcement."); }
    finally { setDeactivateLoading(null); }
  };

  const saveServicePrice = async (serviceType: string) => {
    const edit = priceEdits[serviceType];
    if (!edit) return;
    setPriceSaving(serviceType);
    setPriceSaveResult(r => ({ ...r, [serviceType]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/pricing/services/${serviceType}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ price: parseInt(edit.price), duration: edit.duration, is_active: edit.is_active }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setPriceSaveResult(r => ({ ...r, [serviceType]: "saved" }));
      setTimeout(() => setPriceSaveResult(r => ({ ...r, [serviceType]: "" })), 3000);
    } catch {
      setPriceSaveResult(r => ({ ...r, [serviceType]: "error" }));
    } finally { setPriceSaving(null); }
  };

  const deleteTier = async (id: string) => {
    if (!confirm("Delete this pricing tier? This cannot be undone.")) return;
    setDeletingTier(id);
    try {
      const res = await fetch(`${API_URL}/api/pricing/events/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setEventTiers(prev => prev.filter(t => t.id !== id));
    } catch { alert("Failed to delete tier."); }
    finally { setDeletingTier(null); }
  };

  const createTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setTierFormLoading(true); setTierFormError("");
    try {
      const res = await fetch(`${API_URL}/api/pricing/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          name: tierForm.name.trim(),
          event_type: tierForm.event_type,
          min_athletes: parseInt(tierForm.min_athletes),
          max_athletes: parseInt(tierForm.max_athletes),
          base_price: parseInt(tierForm.base_price),
          price_per_athlete: parseInt(tierForm.price_per_athlete),
          gst_percent: parseFloat(tierForm.gst_percent),
          description: tierForm.description.trim() || null,
          is_active: tierForm.is_active,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setTierForm(emptyTierForm);
      setShowCreateTier(false);
      setTiersTick(t => t + 1);
    } catch (e: unknown) { setTierFormError(e instanceof Error ? e.message : "Failed"); }
    finally { setTierFormLoading(false); }
  };

  const buildQuote = () => {
    const tier = eventTiers.find(t => t.id === calcTierId);
    if (!tier || !calcResult) return "";
    return `CryoRevive Event Pricing Quote
─────────────────────────────
Package: ${tier.name}
Athletes: ${calcAthletes}
Base Fee: ${fmt(calcResult.base_price)}
Per Athlete: ${fmt(tier.price_per_athlete)} × ${calcAthletes} = ${fmt(calcResult.per_athlete_cost)}
Subtotal: ${fmt(calcResult.subtotal)}
GST (${calcResult.gst_percent}%): ${fmt(calcResult.gst_amount)}
─────────────────────────────
TOTAL: ${fmt(calcResult.total)}
Per Person: ${fmt(calcResult.per_person)}
Valid for 7 days. Contact us to confirm.
cryorevive.in | +91 08595850920`;
  };

  const copyQuote = async () => {
    const text = buildQuote();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const sendQuoteWA = () => {
    const text = buildQuote();
    if (!text) return;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleLogout = () => { sessionStorage.removeItem("cryo_admin"); router.push("/admin"); };

  const today = new Date().toISOString().split("T")[0];
  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(term) || b.email.toLowerCase().includes(term);
  });
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    today: bookings.filter(b => String(b.date).startsWith(today)).length,
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <SEO title="Admin Dashboard - CryoRevive" />
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CryoRevive Admin</h1>
              <p className="text-sm text-muted-foreground">Management Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/"><Button variant="outline" size="sm">View Site</Button></Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{stats.confirmed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.today}</div></CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            {(["bookings", "announcements", "pricing"] as DashTab[]).map(tab => {
              const icons = { bookings: Calendar, announcements: Bell, pricing: DollarSign };
              const labels = { bookings: "Bookings", announcements: "Announcements", pricing: "Pricing" };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* ══ Bookings Tab ══ */}
          {activeTab === "bookings" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Bookings</CardTitle>
                <button
                  onClick={() => setTick(t => t + 1)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(s => (
                      <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="sm:w-[160px]" />
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">Loading bookings...</div>
                ) : error ? (
                  <div className="py-12 text-center text-destructive">{error}</div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead>
                          <TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead>
                          <TableHead>Created</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No bookings yet</TableCell></TableRow>
                        ) : filtered.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell>{b.email}</TableCell>
                            <TableCell>{b.phone}</TableCell>
                            <TableCell>{SERVICE_LABELS[b.service_type] ?? b.service_type}</TableCell>
                            <TableCell>{String(b.date).slice(0, 10)}</TableCell>
                            <TableCell>{b.time_slot}</TableCell>
                            <TableCell><StatusBadge status={b.status} /></TableCell>
                            <TableCell><PaymentBadge status={b.payment_status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {b.status === "pending" && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5" disabled={actionLoading !== null} onClick={() => updateStatus(b.id, "confirmed")}>
                                    {actionLoading === b.id + "confirmed" && <Spinner className="h-3 w-3" />}
                                    {actionLoading === b.id + "confirmed" ? "Confirming..." : "Confirm"}
                                  </Button>
                                )}
                                {(b.status === "pending" || b.status === "confirmed") && (
                                  <Button size="sm" variant="destructive" disabled={actionLoading !== null} onClick={() => updateStatus(b.id, "cancelled")} className="flex items-center gap-1.5">
                                    {actionLoading === b.id + "cancelled" && <Spinner className="h-3 w-3" />}
                                    {actionLoading === b.id + "cancelled" ? "Cancelling..." : "Cancel"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ══ Announcements Tab ══ */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Create Announcement</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={postAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title *</label>
                      <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. 20% off Ice Bath this weekend" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Message *</label>
                      <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} placeholder="Write your announcement here..." required rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <select value={annType} onChange={e => setAnnType(e.target.value as AnnouncementType)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {ANN_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Expires At (optional)</label>
                        <Input type="datetime-local" value={annExpiresAt} onChange={e => setAnnExpiresAt(e.target.value)} />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Announcement Image (optional)</label>
                      {annImagePreview ? (
                        <div className="relative mb-2">
                          <img src={annImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-border" />
                          <button
                            type="button"
                            onClick={() => { setAnnImagePreview(""); setAnnImageUrl(""); }}
                            className="absolute top-2 right-2 bg-destructive hover:bg-destructive/80 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                          <Upload size={20} className="text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                          <span className="text-xs text-muted-foreground/60 mt-0.5">JPEG, PNG, WebP — max 5MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setAnnImagePreview(URL.createObjectURL(file));
                              setUploadingImage(true);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await fetch(`${API_URL}/api/notifications/announcements/upload-image`, {
                                  method: "POST",
                                  headers: { "X-Admin-Key": ADMIN_KEY },
                                  body: formData,
                                });
                                const data = await res.json() as { url?: string; detail?: string };
                                if (res.ok && data.url) {
                                  setAnnImageUrl(data.url);
                                } else {
                                  alert("Upload failed: " + (data.detail ?? "Unknown error"));
                                  setAnnImagePreview(""); setAnnImageUrl("");
                                }
                              } catch {
                                alert("Upload failed — check connection");
                                setAnnImagePreview(""); setAnnImageUrl("");
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                        </label>
                      )}
                      {uploadingImage && <p className="text-xs text-primary mt-1">Uploading image…</p>}
                      {annImageUrl && !uploadingImage && <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>}
                    </div>

                    {/* Call to Action */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Call to Action (optional)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {([
                          { type: "booking",  label: "📅 Book Now",   defaultUrl: "https://cryorevive.in/booking",          defaultLabel: "Book Now" },
                          { type: "whatsapp", label: "💬 WhatsApp",   defaultUrl: "https://wa.me/918595850920",             defaultLabel: "Chat on WhatsApp" },
                          { type: "link",     label: "🔗 Custom Link", defaultUrl: "",                                      defaultLabel: "" },
                          { type: "phone",    label: "📞 Call Us",    defaultUrl: "tel:+918595850920",                      defaultLabel: "Call Us" },
                        ] as const).map(opt => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => {
                              setAnnCtaType(opt.type);
                              if (opt.defaultUrl) setAnnCtaUrl(opt.defaultUrl);
                              if (!annCtaLabel && opt.defaultLabel) setAnnCtaLabel(opt.defaultLabel);
                            }}
                            className={`py-2 px-1 text-xs rounded-lg border transition-colors ${
                              annCtaType === opt.type
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-border/80"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={annCtaLabel}
                        onChange={e => setAnnCtaLabel(e.target.value)}
                        placeholder="Button label e.g. Book Now, Grab Offer"
                        className="mb-2"
                      />
                      <Input
                        value={annCtaUrl}
                        onChange={e => setAnnCtaUrl(e.target.value)}
                        placeholder={
                          annCtaType === "whatsapp" ? "https://wa.me/918595850920?text=..." :
                          annCtaType === "booking"  ? "https://cryorevive.in/booking" :
                          annCtaType === "phone"    ? "tel:+918595850920" :
                          "https://..."
                        }
                      />
                      {annCtaType === "whatsapp" && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Pre-fill WhatsApp message (optional):</p>
                          <Input
                            placeholder="e.g. Hi! I want to book a session"
                            onChange={e => {
                              const msg = encodeURIComponent(e.target.value);
                              setAnnCtaUrl(`https://wa.me/918595850920?text=${msg}`);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {postSuccess && <p className="text-sm font-medium text-green-600">{postSuccess}</p>}
                    {postError && <p className="text-sm font-medium text-destructive">{postError}</p>}
                    <Button type="submit" disabled={postLoading || uploadingImage} className="flex items-center gap-2">
                      {postLoading && <Spinner />}
                      {postLoading ? "Posting..." : "Post Announcement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Active Announcements</CardTitle></CardHeader>
                <CardContent>
                  {annLoading ? <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    : annError ? <div className="py-8 text-center text-destructive">{annError}</div>
                    : announcements.length === 0 ? <div className="py-8 text-center text-muted-foreground">No active announcements. Create one above.</div>
                    : (
                      <div className="space-y-4">
                        {announcements.map(a => (
                          <div key={a.id} className="rounded-lg border border-border p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold">{a.title}</p>
                                  <TypeBadge type={a.type} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                  <span>Created: {new Date(a.created_at).toLocaleString()}</span>
                                  {a.expires_at && <span>Expires: {new Date(a.expires_at).toLocaleString()}</span>}
                                  {a.image_url && <span className="text-green-600">📷 Image attached</span>}
                                  {a.cta_label && <span className="text-primary">🔗 CTA: {a.cta_label}</span>}
                                </div>
                                {sendResult[a.id] && <p className="text-xs font-medium text-cyan-600 mt-1">{sendResult[a.id]}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" disabled={sendLoading === a.id} onClick={() => sendPush(a.id)} className="flex items-center gap-1.5">
                                {sendLoading === a.id ? <Spinner className="h-3.5 w-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                                {sendLoading === a.id ? "Sending..." : "Send Push Notification"}
                              </Button>
                              <Button size="sm" variant="destructive" disabled={deactivateLoading === a.id} onClick={() => deactivate(a.id)}>
                                {deactivateLoading === a.id ? "..." : "Deactivate"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ Pricing Tab ══ */}
          {activeTab === "pricing" && (
            <div className="space-y-8">

              {/* Section A: Service Pricing */}
              <Card>
                <CardHeader><CardTitle>In-Centre Session Pricing</CardTitle></CardHeader>
                <CardContent>
                  {priceLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading prices...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Price (₹)</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {servicePrices.map(s => {
                            const edit = priceEdits[s.service_type];
                            if (!edit) return null;
                            const result = priceSaveResult[s.service_type];
                            return (
                              <TableRow key={s.service_type}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>
                                  <Input
                                    value={edit.duration}
                                    onChange={e => setPriceEdits(p => ({ ...p, [s.service_type]: { ...p[s.service_type], duration: e.target.value } }))}
                                    className="w-24 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={edit.price}
                                    onChange={e => setPriceEdits(p => ({ ...p, [s.service_type]: { ...p[s.service_type], price: e.target.value } }))}
                                    className="w-28 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <button
                                    type="button"
                                    onClick={() => setPriceEdits(p => ({ ...p, [s.service_type]: { ...p[s.service_type], is_active: !p[s.service_type].is_active } }))}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${edit.is_active ? "bg-primary" : "bg-muted"}`}
                                  >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${edit.is_active ? "translate-x-[18px]" : "translate-x-1"}`} />
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" disabled={priceSaving === s.service_type} onClick={() => saveServicePrice(s.service_type)} className="flex items-center gap-1.5 h-8">
                                      {priceSaving === s.service_type && <Spinner className="h-3 w-3" />}
                                      Save
                                    </Button>
                                    {result === "saved" && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
                                    {result === "error" && <span className="text-xs text-destructive font-medium">Error</span>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section B: Calculator */}
              <Card>
                <CardHeader><CardTitle>Event Price Calculator</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Pricing Tier</label>
                      <select
                        value={calcTierId}
                        onChange={e => setCalcTierId(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">— Select a tier —</option>
                        {eventTiers.filter(t => t.is_active).map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.min_athletes}–{t.max_athletes} athletes)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Number of Athletes</label>
                      <Input
                        type="number"
                        min={1}
                        value={calcAthletes}
                        onChange={e => setCalcAthletes(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {calcResult && (
                    <div className="rounded-lg border border-border p-4 space-y-2 bg-card mb-4">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Price</span><span>{fmt(calcResult.base_price)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Per Athlete ({calcAthletes} × {fmt(eventTiers.find(t => t.id === calcTierId)?.price_per_athlete ?? 0)})</span><span>{fmt(calcResult.per_athlete_cost)}</span></div>
                      <div className="flex justify-between text-sm border-t border-border pt-2"><span className="text-muted-foreground">Subtotal</span><span>{fmt(calcResult.subtotal)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST ({calcResult.gst_percent}%)</span><span>{fmt(calcResult.gst_amount)}</span></div>
                      <div className="flex justify-between font-bold border-t border-border pt-2"><span>TOTAL</span><span className="text-primary text-lg">{fmt(calcResult.total)}</span></div>
                      <div className="flex justify-between text-sm text-muted-foreground"><span>Per Person</span><span>{fmt(calcResult.per_person)}</span></div>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" disabled={!calcResult} onClick={copyQuote} className="flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      {copySuccess ? "Copied!" : "Copy Quote"}
                    </Button>
                    <Button variant="outline" disabled={!calcResult} onClick={sendQuoteWA} className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50">
                      <MessageCircle className="w-4 h-4" />
                      Send via WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section C: Event Tiers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Event Pricing Tiers</CardTitle>
                  <Button size="sm" onClick={() => { setShowCreateTier(v => !v); setTierFormError(""); }}>
                    {showCreateTier ? <><X className="w-4 h-4 mr-1" />Cancel</> : "+ New Tier"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Create form */}
                  {showCreateTier && (
                    <form onSubmit={createTier} className="mb-6 p-4 border border-border rounded-lg space-y-4 bg-muted/30">
                      <h3 className="font-semibold text-sm">Create New Event Pricing Tier</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tier Name *</label>
                          <Input value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Marathon Package" required />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Event Type *</label>
                          <select value={tierForm.event_type} onChange={e => setTierForm(f => ({ ...f, event_type: e.target.value as EventType }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Min Athletes *</label>
                          <Input type="number" min={1} value={tierForm.min_athletes} onChange={e => setTierForm(f => ({ ...f, min_athletes: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Max Athletes *</label>
                          <Input type="number" min={1} value={tierForm.max_athletes} onChange={e => setTierForm(f => ({ ...f, max_athletes: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Base Price (₹) *</label>
                          <Input type="number" min={0} value={tierForm.base_price} onChange={e => setTierForm(f => ({ ...f, base_price: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Price per Athlete (₹) *</label>
                          <Input type="number" min={0} value={tierForm.price_per_athlete} onChange={e => setTierForm(f => ({ ...f, price_per_athlete: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">GST %</label>
                          <Input type="number" min={0} step={0.5} value={tierForm.gst_percent} onChange={e => setTierForm(f => ({ ...f, gst_percent: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Active</label>
                          <button type="button" onClick={() => setTierForm(f => ({ ...f, is_active: !f.is_active }))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors mt-1 ${tierForm.is_active ? "bg-primary" : "bg-muted"}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${tierForm.is_active ? "translate-x-[18px]" : "translate-x-1"}`} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description (shown on website)</label>
                        <Input value={tierForm.description} onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
                      </div>
                      {tierFormError && <p className="text-sm text-destructive">{tierFormError}</p>}
                      <Button type="submit" disabled={tierFormLoading} className="flex items-center gap-2">
                        {tierFormLoading && <Spinner />}
                        {tierFormLoading ? "Creating..." : "Create Tier"}
                      </Button>
                    </form>
                  )}

                  {/* Tier list */}
                  {tiersLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading tiers...</div>
                  ) : eventTiers.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No event pricing tiers yet. Create one above.</div>
                  ) : (
                    <div className="space-y-4">
                      {eventTiers.map(tier => (
                        <div key={tier.id} className="rounded-lg border border-border p-4">
                          {editingTier === tier.id ? (
                            <TierEditForm
                              tier={tier}
                              apiUrl={API_URL}
                              adminKey={ADMIN_KEY}
                              onSaved={() => { setEditingTier(null); setTiersTick(t => t + 1); }}
                              onCancel={() => setEditingTier(null)}
                            />
                          ) : (
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="font-semibold">{tier.name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                    {tier.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                                  <span>Type: <span className="text-foreground capitalize">{tier.event_type}</span></span>
                                  <span>Athletes: <span className="text-foreground">{tier.min_athletes}–{tier.max_athletes}</span></span>
                                  <span>Base: <span className="text-foreground">{fmt(tier.base_price)}</span></span>
                                  <span>Per athlete: <span className="text-foreground">{fmt(tier.price_per_athlete)}</span></span>
                                  <span>GST: <span className="text-foreground">{tier.gst_percent}%</span></span>
                                </div>
                                {tier.description && <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={() => setEditingTier(tier.id)} className="h-8 px-2">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="destructive" disabled={deletingTier === tier.id} onClick={() => deleteTier(tier.id)} className="h-8 px-2">
                                  {deletingTier === tier.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ── Tier inline edit form ────────────────────────────────────────────────────

function TierEditForm({ tier, apiUrl, adminKey, onSaved, onCancel }: {
  tier: EventPricing;
  apiUrl: string;
  adminKey: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: tier.name,
    base_price: String(tier.base_price),
    price_per_athlete: String(tier.price_per_athlete),
    gst_percent: String(tier.gst_percent),
    min_athletes: String(tier.min_athletes),
    max_athletes: String(tier.max_athletes),
    description: tier.description ?? "",
    is_active: tier.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${apiUrl}/api/pricing/events/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({
          name: form.name,
          base_price: parseInt(form.base_price),
          price_per_athlete: parseInt(form.price_per_athlete),
          gst_percent: parseFloat(form.gst_percent),
          min_athletes: parseInt(form.min_athletes),
          max_athletes: parseInt(form.max_athletes),
          description: form.description || null,
          is_active: form.is_active,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onSaved();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" required /></div>
        <div><label className="text-xs font-medium mb-1 block">Base Price (₹)</label><Input type="number" min={0} value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs font-medium mb-1 block">Per Athlete (₹)</label><Input type="number" min={0} value={form.price_per_athlete} onChange={e => setForm(f => ({ ...f, price_per_athlete: e.target.value }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs font-medium mb-1 block">GST %</label><Input type="number" min={0} step={0.5} value={form.gst_percent} onChange={e => setForm(f => ({ ...f, gst_percent: e.target.value }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs font-medium mb-1 block">Min Athletes</label><Input type="number" min={1} value={form.min_athletes} onChange={e => setForm(f => ({ ...f, min_athletes: e.target.value }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs font-medium mb-1 block">Max Athletes</label><Input type="number" min={1} value={form.max_athletes} onChange={e => setForm(f => ({ ...f, max_athletes: e.target.value }))} className="h-8 text-sm" /></div>
      </div>
      <div><label className="text-xs font-medium mb-1 block">Description</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-8 text-sm" /></div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium">Active</label>
        <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-muted"}`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.is_active ? "translate-x-[18px]" : "translate-x-1"}`} />
        </button>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-1.5">
          {saving && <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Badge helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "confirmed") return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Confirmed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Pending</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Paid</Badge>;
  return <Badge variant="secondary">Unpaid</Badge>;
}

const TYPE_STYLES: Record<AnnouncementType, string> = {
  offer: "bg-amber-100 text-amber-800 border border-amber-200",
  feature: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  event: "bg-purple-100 text-purple-800 border border-purple-200",
  general: "bg-gray-100 text-gray-700 border border-gray-200",
};
const TYPE_LABELS: Record<AnnouncementType, string> = {
  offer: "Offer", feature: "Feature Update", event: "Event", general: "General",
};
function TypeBadge({ type }: { type: AnnouncementType }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.general;
  const label = TYPE_LABELS[type] ?? type;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}
