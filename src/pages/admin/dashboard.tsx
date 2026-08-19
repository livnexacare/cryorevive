import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, Calendar, TrendingUp, CheckCircle2, Clock, Bell, DollarSign, Trash2, Pencil, X, Copy, MessageCircle, RefreshCw, Upload, Eye, Tag, Users, KeyRound, Wallet } from "lucide-react";

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

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show" | "postponed";
type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial";
type DashTab = "bookings" | "announcements" | "pricing" | "coupons" | "staff" | "slots" | "payroll" | "members";
type AnnouncementType = "general" | "offer" | "feature" | "event";
type EventType = "marathon" | "corporate" | "sports" | "school" | "military" | "custom";
type StaffRole = "receptionist" | "therapist" | "manager";

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
  payment_status: PaymentStatus;
  created_at: string;
}

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  pay_type: "daily" | "monthly";
  daily_wage: number | null;
  monthly_salary: number | null;
  period_start: string;
  period_end: string;
  days_worked: number;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  notes: string | null;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  status: "present" | "absent" | "half_day" | "leave";
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
}

type MembershipStatus = "active" | "expired" | "paused" | "cancelled";

interface Membership {
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
  status: MembershipStatus;
  notes: string | null;
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

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_value: number;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface StaffAccount {
  id: string;
  username: string;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface CustomSlot {
  id: string;
  time_slot: string;
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

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled", "completed", "no_show", "postponed"] as const;

const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
  { value: "postponed", label: "Postponed" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "partial", label: "Partial" },
];

const PAY_TYPE_OPTIONS: { value: "daily" | "monthly"; label: string }[] = [
  { value: "daily", label: "Daily wage" },
  { value: "monthly", label: "Monthly salary" },
];

const MEMBERSHIP_PACKAGES: { key: string; label: string; sessions: number; price: number }[] = [
  { key: "starter", label: "Starter", sessions: 8, price: 5999 },
  { key: "athlete", label: "Athlete", sessions: 16, price: 9999 },
  { key: "elite", label: "Elite", sessions: 30, price: 15999 },
];

const MEMBERSHIP_STATUS_FILTERS = ["all", "active", "expired", "paused", "cancelled"] as const;

const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceRecord["status"]; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "receptionist", label: "Receptionist" },
  { value: "therapist", label: "Therapist" },
  { value: "manager", label: "Manager" },
];

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

function formatSlotLabel(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
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
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  // Payroll state
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollTick, setPayrollTick] = useState(0);
  const [payrollStaffFilter, setPayrollStaffFilter] = useState("");
  const emptyPayrollForm = {
    staff_id: "", pay_type: "daily" as "daily" | "monthly",
    daily_wage: "", monthly_salary: "",
    period_start: "", period_end: "",
    days_worked: "0", amount_paid: "0", notes: "",
  };
  const [payrollForm, setPayrollForm] = useState(emptyPayrollForm);
  const [payrollFormLoading, setPayrollFormLoading] = useState(false);
  const [payrollFormError, setPayrollFormError] = useState("");
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);

  // Attendance state
  const [attendanceStaffId, setAttendanceStaffId] = useState("");
  const [attendanceMonth, setAttendanceMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceTick, setAttendanceTick] = useState(0);
  const emptyAttendanceForm = { date: "", status: "present" as AttendanceRecord["status"], check_in: "", check_out: "", notes: "" };
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendanceForm);
  const [attendanceFormLoading, setAttendanceFormLoading] = useState(false);
  const [attendanceFormError, setAttendanceFormError] = useState("");

  // Memberships state
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsTick, setMembershipsTick] = useState(0);
  const [memberFilter, setMemberFilter] = useState<typeof MEMBERSHIP_STATUS_FILTERS[number]>("all");
  const [showAddMembership, setShowAddMembership] = useState(false);
  const emptyMembershipForm = {
    client_id: "", client_name: "", client_mobile: "",
    package_type: "", sessions_total: 8, price_paid: 5999,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };
  const [newMembership, setNewMembership] = useState(emptyMembershipForm);
  const [membershipFormLoading, setMembershipFormLoading] = useState(false);
  const [membershipFormError, setMembershipFormError] = useState("");
  const [membershipClientQuery, setMembershipClientQuery] = useState("");
  const [membershipClientSearching, setMembershipClientSearching] = useState(false);
  const [useSessionMembershipId, setUseSessionMembershipId] = useState<string | null>(null);
  const [useSessionServiceType, setUseSessionServiceType] = useState("");

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

  // Preview state
  const [imagePreviewSize, setImagePreviewSize] = useState("h-auto");
  const [showPreview, setShowPreview] = useState(false);

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

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsTick, setCouponsTick] = useState(0);
  const emptyCouponForm = {
    code: "", discount_type: "percentage" as "percentage" | "flat", discount_value: "",
    min_order_value: "0", usage_limit: "", expires_at: "", description: "", is_active: true,
  };
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [couponFormLoading, setCouponFormLoading] = useState(false);
  const [couponFormError, setCouponFormError] = useState("");
  const [couponActionLoading, setCouponActionLoading] = useState<string | null>(null);

  // Staff accounts state
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffTick, setStaffTick] = useState(0);
  const emptyStaffForm = { username: "", password: "", full_name: "", role: "receptionist" as StaffRole };
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffFormLoading, setStaffFormLoading] = useState(false);
  const [staffFormError, setStaffFormError] = useState("");
  const [staffActionLoading, setStaffActionLoading] = useState<string | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<Record<string, string>>({});

  // Admin password reset state
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminPwLoading, setAdminPwLoading] = useState(false);
  const [adminPwMessage, setAdminPwMessage] = useState("");
  const [adminPwError, setAdminPwError] = useState("");

  // Custom slots state
  const [customSlots, setCustomSlots] = useState<CustomSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsTick, setSlotsTick] = useState(0);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [slotFormLoading, setSlotFormLoading] = useState(false);
  const [slotFormError, setSlotFormError] = useState("");
  const [slotActionLoading, setSlotActionLoading] = useState<string | null>(null);

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

  // ── Fetch coupons ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "coupons") return;
    let cancelled = false;
    setCouponsLoading(true);
    fetch(`${API_URL}/api/coupons`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: Coupon[]) => { if (!cancelled) setCoupons(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setCoupons([]); })
      .finally(() => { if (!cancelled) setCouponsLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, couponsTick]);

  // ── Fetch staff accounts ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || (activeTab !== "staff" && activeTab !== "payroll")) return;
    let cancelled = false;
    setStaffLoading(true);
    fetch(`${API_URL}/api/staff/accounts`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: StaffAccount[]) => { if (!cancelled) setStaffAccounts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setStaffAccounts([]); })
      .finally(() => { if (!cancelled) setStaffLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, staffTick]);

  // ── Fetch payroll records ────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "payroll") return;
    let cancelled = false;
    setPayrollLoading(true);
    const qs = payrollStaffFilter ? `?staff_id=${payrollStaffFilter}` : "";
    fetch(`${API_URL}/api/payroll${qs}`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: PayrollRecord[]) => { if (!cancelled) setPayrollRecords(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setPayrollRecords([]); })
      .finally(() => { if (!cancelled) setPayrollLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, payrollTick, payrollStaffFilter]);

  // ── Fetch attendance ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "payroll" || !attendanceStaffId) { setAttendanceRecords([]); return; }
    let cancelled = false;
    setAttendanceLoading(true);
    fetch(`${API_URL}/api/attendance?staff_id=${attendanceStaffId}&month=${attendanceMonth}`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: AttendanceRecord[]) => { if (!cancelled) setAttendanceRecords(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setAttendanceRecords([]); })
      .finally(() => { if (!cancelled) setAttendanceLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, attendanceStaffId, attendanceMonth, attendanceTick]);

  // ── Fetch memberships ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "members") return;
    let cancelled = false;
    setMembershipsLoading(true);
    const qs = memberFilter !== "all" ? `?status=${memberFilter}` : "";
    fetch(`${API_URL}/api/memberships${qs}`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: Membership[]) => { if (!cancelled) setMemberships(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMemberships([]); })
      .finally(() => { if (!cancelled) setMembershipsLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, membershipsTick, memberFilter]);

  // ── Fetch custom slots ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "slots") return;
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`${API_URL}/api/admin/slots`, { headers: { "X-Admin-Key": ADMIN_KEY } })
      .then(r => r.json())
      .then((data: CustomSlot[]) => { if (!cancelled) setCustomSlots(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setCustomSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeTab, slotsTick]);

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

  const createPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayrollFormLoading(true); setPayrollFormError("");
    try {
      const staff = staffAccounts.find(s => s.id === payrollForm.staff_id);
      if (!staff) throw new Error("Select a staff member");
      if (!payrollForm.period_start || !payrollForm.period_end) throw new Error("Period start and end are required");

      const res = await fetch(`${API_URL}/api/payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          staff_id: payrollForm.staff_id,
          staff_name: staff.full_name,
          pay_type: payrollForm.pay_type,
          daily_wage: payrollForm.daily_wage ? parseInt(payrollForm.daily_wage) : null,
          monthly_salary: payrollForm.monthly_salary ? parseInt(payrollForm.monthly_salary) : null,
          period_start: payrollForm.period_start,
          period_end: payrollForm.period_end,
          days_worked: parseInt(payrollForm.days_worked) || 0,
          amount_paid: parseInt(payrollForm.amount_paid) || 0,
          notes: payrollForm.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setPayrollForm(emptyPayrollForm);
      setPayrollTick(t => t + 1);
    } catch (e: unknown) { setPayrollFormError(e instanceof Error ? e.message : "Failed to create payroll record"); }
    finally { setPayrollFormLoading(false); }
  };

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceStaffId || !attendanceForm.date) return;
    setAttendanceFormLoading(true); setAttendanceFormError("");
    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          staff_id: attendanceStaffId,
          date: attendanceForm.date,
          status: attendanceForm.status,
          check_in: attendanceForm.check_in || null,
          check_out: attendanceForm.check_out || null,
          notes: attendanceForm.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setAttendanceForm(emptyAttendanceForm);
      setAttendanceTick(t => t + 1);
    } catch (e: unknown) { setAttendanceFormError(e instanceof Error ? e.message : "Failed to mark attendance"); }
    finally { setAttendanceFormLoading(false); }
  };

  const searchMembershipClient = async () => {
    if (!membershipClientQuery.trim()) return;
    setMembershipClientSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/search?q=${encodeURIComponent(membershipClientQuery.trim())}`, {
        headers: { "X-Staff-Key": ADMIN_KEY },
      });
      const data = await res.json();
      const found = Array.isArray(data) ? data[0] : null;
      if (found) {
        setNewMembership(f => ({ ...f, client_id: found.id, client_name: found.full_name, client_mobile: found.mobile }));
      }
    } catch { /* no-op, user can retry */ }
    finally { setMembershipClientSearching(false); }
  };

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setMembershipFormLoading(true); setMembershipFormError("");
    try {
      if (!newMembership.client_id) throw new Error("Search and select a client first");
      if (!newMembership.package_type) throw new Error("Choose a package");
      const res = await fetch(`${API_URL}/api/memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify(newMembership),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setShowAddMembership(false);
      setNewMembership(emptyMembershipForm);
      setMembershipClientQuery("");
      setMembershipsTick(t => t + 1);
    } catch (e: unknown) { setMembershipFormError(e instanceof Error ? e.message : "Failed to create membership"); }
    finally { setMembershipFormLoading(false); }
  };

  const confirmUseSession = async () => {
    if (!useSessionMembershipId || !useSessionServiceType) return;
    try {
      const res = await fetch(`${API_URL}/api/memberships/${useSessionMembershipId}/use-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ service_type: useSessionServiceType }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUseSessionMembershipId(null);
      setUseSessionServiceType("");
      setMembershipsTick(t => t + 1);
    } catch { alert("Failed to log session usage."); }
  };

  const toggleMembershipPause = async (id: string, currentStatus: MembershipStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/memberships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ status: currentStatus === "active" ? "paused" : "active" }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setMembershipsTick(t => t + 1);
    } catch { alert("Failed to update membership."); }
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

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormLoading(true); setCouponFormError("");
    try {
      const res = await fetch(`${API_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          code: couponForm.code.trim(),
          discount_type: couponForm.discount_type,
          discount_value: parseFloat(couponForm.discount_value),
          min_order_value: parseFloat(couponForm.min_order_value) || 0,
          usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
          expires_at: couponForm.expires_at || null,
          description: couponForm.description.trim() || null,
          is_active: couponForm.is_active,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setCouponForm(emptyCouponForm);
      setCouponsTick(t => t + 1);
    } catch (e: unknown) { setCouponFormError(e instanceof Error ? e.message : "Failed to create coupon"); }
    finally { setCouponFormLoading(false); }
  };

  const toggleCoupon = async (id: string, is_active: boolean) => {
    setCouponActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active } : c));
    } catch { alert("Failed to update coupon."); }
    finally { setCouponActionLoading(null); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    setCouponActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch { alert("Failed to delete coupon."); }
    finally { setCouponActionLoading(null); }
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormLoading(true); setStaffFormError("");
    try {
      const res = await fetch(`${API_URL}/api/staff/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          username: staffForm.username.trim(),
          password: staffForm.password,
          full_name: staffForm.full_name.trim(),
          role: staffForm.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setStaffForm(emptyStaffForm);
      setStaffTick(t => t + 1);
    } catch (e: unknown) { setStaffFormError(e instanceof Error ? e.message : "Failed to create staff account"); }
    finally { setStaffFormLoading(false); }
  };

  const toggleStaffActive = async (id: string, is_active: boolean) => {
    setStaffActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/staff/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setStaffAccounts(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
    } catch { alert("Failed to update staff account."); }
    finally { setStaffActionLoading(null); }
  };

  const resetStaffPassword = async (id: string) => {
    if (!confirm("Reset this staff member's password? Their current password will stop working immediately.")) return;
    setStaffActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/staff/accounts/${id}/reset-password`, {
        method: "POST",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as { temp_password: string };
      setTempPasswordResult(r => ({ ...r, [id]: data.temp_password }));
    } catch { alert("Failed to reset password."); }
    finally { setStaffActionLoading(null); }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff account? This cannot be undone.")) return;
    setStaffActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/staff/accounts/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setStaffAccounts(prev => prev.filter(s => s.id !== id));
    } catch { alert("Failed to delete staff account."); }
    finally { setStaffActionLoading(null); }
  };

  const changeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPwLoading(true); setAdminPwError(""); setAdminPwMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ new_password: adminNewPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      const data = await res.json() as { message: string; instruction: string };
      setAdminPwMessage(`${data.message}. ${data.instruction}`);
      setAdminNewPassword("");
    } catch (e: unknown) { setAdminPwError(e instanceof Error ? e.message : "Failed"); }
    finally { setAdminPwLoading(false); }
  };

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotFormLoading(true); setSlotFormError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ time_slot: newSlotTime }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setNewSlotTime("");
      setSlotsTick(t => t + 1);
    } catch (e: unknown) { setSlotFormError(e instanceof Error ? e.message : "Failed to add slot"); }
    finally { setSlotFormLoading(false); }
  };

  const toggleSlot = async (id: string, is_active: boolean) => {
    setSlotActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setCustomSlots(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
    } catch { alert("Failed to update slot."); }
    finally { setSlotActionLoading(null); }
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
        <header className="border-b border-border bg-card sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-2xl font-bold">CryoRevive Admin</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Management Dashboard</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/"><Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">View Site</Button></Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-4 sm:py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6"><div className="text-xl sm:text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6"><div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6"><div className="text-xl sm:text-2xl font-bold text-green-600">{stats.confirmed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Today&apos;s Bookings</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6"><div className="text-xl sm:text-2xl font-bold">{stats.today}</div></CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto scrollbar-hide sticky top-[57px] sm:top-[73px] z-10 bg-background">
            {(["bookings", "announcements", "pricing", "coupons", "staff", "slots", "payroll", "members"] as DashTab[]).map(tab => {
              const icons = { bookings: Calendar, announcements: Bell, pricing: DollarSign, coupons: Tag, staff: Users, slots: Clock, payroll: Wallet, members: Users };
              const labels = { bookings: "Bookings", announcements: "Announcements", pricing: "Pricing", coupons: "Coupons", staff: "Staff", slots: "Slots", payroll: "Payroll", members: "Members" };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
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
                        {s === "all" ? "All" : BOOKING_STATUS_OPTIONS.find(o => o.value === s)?.label ?? s}
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
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No bookings yet</div>
                ) : (
                  <>
                    {/* Mobile: cards */}
                    <div className="block md:hidden space-y-3">
                      {filtered.map(b => (
                        <div key={b.id} className="bg-card rounded-xl p-4 border border-border">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground font-mono">#{b.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-foreground font-bold">{b.name}</p>
                              <p className="text-muted-foreground text-sm">{b.phone}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <StatusBadge status={b.status} />
                              <PaymentBadge status={b.payment_status} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div>
                              <p className="text-muted-foreground">Service</p>
                              <p className="text-foreground">{SERVICE_LABELS[b.service_type] ?? b.service_type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="text-foreground">{new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Time</p>
                              <p className="text-foreground">{b.time_slot}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 h-9" onClick={() => setEditingBookingId(b.id)}>
                              <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
                            </Button>
                            {b.status === "pending" && (
                              <Button size="sm" className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white" disabled={actionLoading !== null} onClick={() => updateStatus(b.id, "confirmed")}>
                                {actionLoading === b.id + "confirmed" ? <Spinner className="h-3 w-3" /> : "Confirm"}
                              </Button>
                            )}
                            {(b.status === "pending" || b.status === "confirmed") && (
                              <Button size="sm" variant="destructive" className="flex-1 h-9" disabled={actionLoading !== null} onClick={() => updateStatus(b.id, "cancelled")}>
                                {actionLoading === b.id + "cancelled" ? <Spinner className="h-3 w-3" /> : "Cancel"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile: full-screen edit modal */}
                    {editingBookingId && (
                      <div className="md:hidden fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setEditingBookingId(null)}>
                        <div className="w-full bg-card rounded-t-2xl p-5 border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Edit Booking</h3>
                            <button onClick={() => setEditingBookingId(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                          </div>
                          {(() => {
                            const b = filtered.find(x => x.id === editingBookingId);
                            if (!b) return null;
                            return (
                              <BookingEditForm
                                booking={b}
                                apiUrl={API_URL}
                                adminKey={ADMIN_KEY}
                                onSaved={() => { setEditingBookingId(null); setTick(t => t + 1); }}
                                onCancel={() => setEditingBookingId(null)}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Desktop: table */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
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
                          {filtered.map(b => (
                            <>
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
                                    <Button size="sm" variant="outline" onClick={() => setEditingBookingId(editingBookingId === b.id ? null : b.id)} className="h-8 px-2">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {editingBookingId === b.id && (
                                <TableRow key={b.id + "-edit"}>
                                  <TableCell colSpan={11} className="bg-muted/30">
                                    <BookingEditForm
                                      booking={b}
                                      apiUrl={API_URL}
                                      adminKey={ADMIN_KEY}
                                      onSaved={() => { setEditingBookingId(null); setTick(t => t + 1); }}
                                      onCancel={() => setEditingBookingId(null)}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
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
                        <div className="mb-2">
                          <div className="relative mb-2">
                            <img src={annImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-border" />
                            <button
                              type="button"
                              onClick={() => { setAnnImagePreview(""); setAnnImageUrl(""); setImagePreviewSize("h-auto"); }}
                              className="absolute top-2 right-2 bg-destructive hover:bg-destructive/80 text-white rounded-full p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {annImageUrl && (
                            <div className="mt-3">
                              <p className="text-muted-foreground text-xs mb-2">Preview crop style</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {([
                                  { label: 'Full Width', height: 'h-auto' },
                                  { label: 'Banner 16:9', height: 'aspect-video' },
                                  { label: 'Square 1:1', height: 'aspect-square' },
                                  { label: 'Portrait 4:5', height: 'aspect-[4/5]' },
                                ]).map(size => (
                                  <button
                                    key={size.label}
                                    type="button"
                                    onClick={() => setImagePreviewSize(size.height)}
                                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                      imagePreviewSize === size.height
                                        ? 'border-primary text-primary bg-primary/10'
                                        : 'border-border text-muted-foreground hover:border-border/60'
                                    }`}
                                  >
                                    {size.label}
                                  </button>
                                ))}
                              </div>
                              <div className={`w-full overflow-hidden rounded-xl border border-border ${imagePreviewSize !== 'h-auto' ? imagePreviewSize : ''}`}>
                                <img
                                  src={annImageUrl}
                                  alt="Crop preview"
                                  className={`w-full object-cover ${imagePreviewSize === 'h-auto' ? 'h-auto' : 'h-full'}`}
                                />
                              </div>
                            </div>
                          )}
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

                    {/* Preview button */}
                    {annTitle && annBody && (
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="w-full py-2.5 text-sm border border-border text-muted-foreground rounded-xl hover:border-border/60 hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        Preview Announcement
                      </button>
                    )}

                    <Button type="submit" disabled={postLoading || uploadingImage} className="flex items-center gap-2">
                      {postLoading && <Spinner />}
                      {postLoading ? "Posting..." : "Post Announcement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Preview Modal */}
              {showPreview && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
                  <div className="w-full max-w-md">
                    <p className="text-muted-foreground text-xs text-center mb-3">Preview — how it will appear on site</p>
                    <div className="bg-gray-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl">
                      {annImageUrl && (
                        <img src={annImageUrl} alt={annTitle} className="w-full object-cover" style={{ maxHeight: '280px' }} />
                      )}
                      <div className="px-5 pt-4 pb-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${
                          annType === 'offer' ? 'bg-amber-500' :
                          annType === 'feature' ? 'bg-cyan-500' :
                          annType === 'event' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {annType === 'offer' ? '🎁 Special Offer' :
                           annType === 'feature' ? '✨ New Feature' :
                           annType === 'event' ? '📅 Event' : '📢 Announcement'}
                        </span>
                        <h2 className="text-white text-lg font-bold mt-2 mb-2">{annTitle}</h2>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">{annBody}</p>
                        {annCtaLabel && (
                          <div className="w-full py-3 text-sm text-white font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl text-center mb-3">
                            {annCtaType === 'whatsapp' && '💬 '}
                            {annCtaType === 'booking' && '📅 '}
                            {annCtaType === 'phone' && '📞 '}
                            {annCtaLabel}
                          </div>
                        )}
                        <div className="w-full py-2.5 text-sm text-center text-gray-400 border border-gray-700 rounded-xl">
                          Got it!
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              )}

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

          {/* ══ Coupons Tab ══ */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Create New Coupon</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createCoupon} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Coupon Code *</label>
                        <Input
                          value={couponForm.code}
                          onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          placeholder="e.g. LAUNCH20"
                          className="uppercase tracking-wider"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <select
                          value={couponForm.discount_type}
                          onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value as "percentage" | "flat" }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          {couponForm.discount_type === "percentage" ? "Discount %" : "Discount ₹"} *
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={couponForm.discount_value}
                          onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))}
                          placeholder={couponForm.discount_type === "percentage" ? "20" : "100"}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Min Order Value (₹)</label>
                        <Input
                          type="number"
                          min={0}
                          value={couponForm.min_order_value}
                          onChange={e => setCouponForm(f => ({ ...f, min_order_value: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Usage Limit (blank = unlimited)</label>
                        <Input
                          type="number"
                          min={1}
                          value={couponForm.usage_limit}
                          onChange={e => setCouponForm(f => ({ ...f, usage_limit: e.target.value }))}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Expiry Date (blank = never)</label>
                        <Input
                          type="date"
                          value={couponForm.expires_at}
                          onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Input
                          value={couponForm.description}
                          onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="e.g. 20% off on studio launch"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Active</span>
                        <button
                          type="button"
                          onClick={() => setCouponForm(f => ({ ...f, is_active: !f.is_active }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${couponForm.is_active ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${couponForm.is_active ? "translate-x-[18px]" : "translate-x-1"}`} />
                        </button>
                      </div>
                    </div>
                    {couponFormError && <p className="text-sm text-destructive">{couponFormError}</p>}
                    <Button
                      type="submit"
                      disabled={couponFormLoading || !couponForm.code.trim() || !couponForm.discount_value}
                      className="w-full flex items-center gap-2"
                    >
                      {couponFormLoading && <Spinner />}
                      {couponFormLoading ? "Creating..." : "Create Coupon"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Coupons</CardTitle></CardHeader>
                <CardContent>
                  {couponsLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading coupons...</div>
                  ) : coupons.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No coupons yet. Create one above.</div>
                  ) : (
                    <div className="space-y-4">
                      {coupons.map(coupon => {
                        const isExpired = Boolean(coupon.expires_at && new Date(coupon.expires_at) < new Date());
                        const isLive = coupon.is_active && !isExpired;
                        return (
                          <div key={coupon.id} className="rounded-lg border border-border p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-mono font-black tracking-widest bg-muted px-3 py-1 rounded-lg">
                                    {coupon.code}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                                    {isExpired ? "Expired" : coupon.is_active ? "Active" : "Inactive"}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                                    {coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                                  </span>
                                </div>
                                {coupon.description && <p className="text-muted-foreground text-xs mb-2">{coupon.description}</p>}
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                  <span>Used: {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : "/∞"}</span>
                                  {coupon.min_order_value > 0 && <span>Min: {fmt(coupon.min_order_value)}</span>}
                                  {coupon.expires_at && (
                                    <span className={isExpired ? "text-destructive" : ""}>
                                      Expires: {new Date(coupon.expires_at).toLocaleDateString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={couponActionLoading === coupon.id}
                                  onClick={() => toggleCoupon(coupon.id, !coupon.is_active)}
                                  className="h-8"
                                >
                                  {coupon.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={couponActionLoading === coupon.id}
                                  onClick={() => deleteCoupon(coupon.id)}
                                  className="h-8 px-2"
                                >
                                  {couponActionLoading === coupon.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ Staff Tab ══ */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" />Admin Password</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={changeAdminPassword} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="text-sm font-medium mb-1 block">New Password</label>
                      <Input
                        type="password"
                        value={adminNewPassword}
                        onChange={e => setAdminNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={adminPwLoading || adminNewPassword.length < 6} className="flex items-center gap-2">
                      {adminPwLoading && <Spinner />}
                      {adminPwLoading ? "Updating..." : "Update"}
                    </Button>
                  </form>
                  {adminPwError && <p className="text-sm text-destructive mt-2">{adminPwError}</p>}
                  {adminPwMessage && <p className="text-sm text-muted-foreground mt-2">{adminPwMessage}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Create Staff Account</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createStaff} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Username *</label>
                        <Input
                          value={staffForm.username}
                          onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="e.g. priya"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Password *</label>
                        <Input
                          type="password"
                          value={staffForm.password}
                          onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="At least 6 characters"
                          minLength={6}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Full Name *</label>
                        <Input
                          value={staffForm.full_name}
                          onChange={e => setStaffForm(f => ({ ...f, full_name: e.target.value }))}
                          placeholder="e.g. Priya Sharma"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Role</label>
                        <select
                          value={staffForm.role}
                          onChange={e => setStaffForm(f => ({ ...f, role: e.target.value as StaffRole }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {STAFF_ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {staffFormError && <p className="text-sm text-destructive">{staffFormError}</p>}
                    <Button
                      type="submit"
                      disabled={staffFormLoading || !staffForm.username.trim() || staffForm.password.length < 6 || !staffForm.full_name.trim()}
                      className="w-full flex items-center gap-2"
                    >
                      {staffFormLoading && <Spinner />}
                      {staffFormLoading ? "Creating..." : "Create Staff Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Staff Accounts</CardTitle></CardHeader>
                <CardContent>
                  {staffLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading staff accounts...</div>
                  ) : staffAccounts.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No staff accounts yet. Create one above.</div>
                  ) : (
                    <div className="space-y-4">
                      {staffAccounts.map(staff => (
                        <div key={staff.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold">{staff.full_name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                                  {STAFF_ROLE_OPTIONS.find(o => o.value === staff.role)?.label ?? staff.role}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${staff.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                                  {staff.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">@{staff.username}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {staff.last_login ? `Last login: ${new Date(staff.last_login).toLocaleString("en-IN")}` : "Never logged in"}
                              </div>
                              {tempPasswordResult[staff.id] && (
                                <p className="text-xs mt-2 bg-muted/50 rounded px-2 py-1 font-mono">
                                  New password: <span className="font-bold">{tempPasswordResult[staff.id]}</span> — share this with {staff.full_name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={staffActionLoading === staff.id}
                                onClick={() => toggleStaffActive(staff.id, !staff.is_active)}
                                className="h-8"
                              >
                                {staff.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={staffActionLoading === staff.id}
                                onClick={() => resetStaffPassword(staff.id)}
                                className="h-8"
                              >
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={staffActionLoading === staff.id}
                                onClick={() => deleteStaff(staff.id)}
                                className="h-8 px-2"
                              >
                                {staffActionLoading === staff.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ Slots Tab ══ */}
          {activeTab === "slots" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Add Time Slot</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createSlot} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="text-sm font-medium mb-1 block">Time (24-hour, e.g. 07:30)</label>
                      <Input
                        type="time"
                        value={newSlotTime}
                        onChange={e => setNewSlotTime(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={slotFormLoading || !newSlotTime} className="flex items-center gap-2">
                      {slotFormLoading && <Spinner />}
                      {slotFormLoading ? "Adding..." : "Add Slot"}
                    </Button>
                  </form>
                  {slotFormError && <p className="text-sm text-destructive mt-2">{slotFormError}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Time Slots</CardTitle></CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading time slots...</div>
                  ) : customSlots.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No time slots configured. Add one above.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {customSlots.map(slot => (
                        <button
                          key={slot.id}
                          disabled={slotActionLoading === slot.id}
                          onClick={() => toggleSlot(slot.id, !slot.is_active)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            slot.is_active
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-muted/30 text-muted-foreground line-through"
                          }`}
                        >
                          {formatSlotLabel(slot.time_slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ Payroll Tab ══ */}
          {activeTab === "payroll" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Add Payroll Record</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createPayroll} className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Staff Member *</label>
                        <select
                          value={payrollForm.staff_id}
                          onChange={e => setPayrollForm(f => ({ ...f, staff_id: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Select staff...</option>
                          {staffAccounts.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Pay Type</label>
                        <select
                          value={payrollForm.pay_type}
                          onChange={e => setPayrollForm(f => ({ ...f, pay_type: e.target.value as "daily" | "monthly" }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {PAY_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      {payrollForm.pay_type === "daily" ? (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Daily Wage (₹)</label>
                          <Input type="number" min={0} value={payrollForm.daily_wage} onChange={e => setPayrollForm(f => ({ ...f, daily_wage: e.target.value }))} />
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Monthly Salary (₹)</label>
                          <Input type="number" min={0} value={payrollForm.monthly_salary} onChange={e => setPayrollForm(f => ({ ...f, monthly_salary: e.target.value }))} />
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Period Start *</label>
                        <Input type="date" value={payrollForm.period_start} onChange={e => setPayrollForm(f => ({ ...f, period_start: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Period End *</label>
                        <Input type="date" value={payrollForm.period_end} onChange={e => setPayrollForm(f => ({ ...f, period_end: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Days Worked</label>
                        <Input type="number" min={0} value={payrollForm.days_worked} onChange={e => setPayrollForm(f => ({ ...f, days_worked: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Amount Paid (₹)</label>
                        <Input type="number" min={0} value={payrollForm.amount_paid} onChange={e => setPayrollForm(f => ({ ...f, amount_paid: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Notes</label>
                        <Input value={payrollForm.notes} onChange={e => setPayrollForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                    {payrollFormError && <p className="text-sm text-destructive">{payrollFormError}</p>}
                    <Button type="submit" disabled={payrollFormLoading} className="flex items-center gap-2">
                      {payrollFormLoading && <Spinner />}
                      {payrollFormLoading ? "Adding..." : "Add Payroll Record"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payroll Records</CardTitle>
                  <select
                    value={payrollStaffFilter}
                    onChange={e => setPayrollStaffFilter(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="">All staff</option>
                    {staffAccounts.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </CardHeader>
                <CardContent>
                  {payrollLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading payroll records...</div>
                  ) : payrollRecords.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No payroll records yet. Add one above.</div>
                  ) : (
                    <div className="space-y-4">
                      {payrollRecords.map(rec => (
                        <div key={rec.id} className="rounded-lg border border-border p-4">
                          {editingPayrollId === rec.id ? (
                            <PayrollEditForm
                              record={rec}
                              apiUrl={API_URL}
                              adminKey={ADMIN_KEY}
                              onSaved={() => { setEditingPayrollId(null); setPayrollTick(t => t + 1); }}
                              onCancel={() => setEditingPayrollId(null)}
                            />
                          ) : (
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold">{rec.staff_name}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                                    {rec.pay_type === "daily" ? "Daily" : "Monthly"}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {String(rec.period_start).slice(0, 10)} – {String(rec.period_end).slice(0, 10)}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                                  <span>Days: <span className="text-foreground">{rec.days_worked}</span></span>
                                  <span>Total: <span className="text-foreground">{fmt(rec.total_amount)}</span></span>
                                  <span>Paid: <span className="text-foreground">{fmt(rec.amount_paid)}</span></span>
                                  <span>Pending: <span className={rec.amount_pending > 0 ? "text-destructive" : "text-foreground"}>{fmt(rec.amount_pending)}</span></span>
                                </div>
                                {rec.notes && <p className="text-xs text-muted-foreground mt-2">{rec.notes}</p>}
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setEditingPayrollId(rec.id)} className="h-8 px-2 shrink-0">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Attendance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={attendanceStaffId}
                      onChange={e => setAttendanceStaffId(e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select staff...</option>
                      {staffAccounts.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                    <Input type="month" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)} className="sm:w-[160px]" />
                  </div>

                  {attendanceStaffId && (
                    <form onSubmit={markAttendance} className="grid sm:grid-cols-5 gap-3 items-end border-t border-border pt-4">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Date *</label>
                        <Input type="date" value={attendanceForm.date} onChange={e => setAttendanceForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" required />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Status</label>
                        <select
                          value={attendanceForm.status}
                          onChange={e => setAttendanceForm(f => ({ ...f, status: e.target.value as AttendanceRecord["status"] }))}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {ATTENDANCE_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Check In</label>
                        <Input type="time" value={attendanceForm.check_in} onChange={e => setAttendanceForm(f => ({ ...f, check_in: e.target.value }))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Check Out</label>
                        <Input type="time" value={attendanceForm.check_out} onChange={e => setAttendanceForm(f => ({ ...f, check_out: e.target.value }))} className="h-8 text-sm" />
                      </div>
                      <Button type="submit" size="sm" disabled={attendanceFormLoading} className="flex items-center gap-1.5 h-8">
                        {attendanceFormLoading && <Spinner className="h-3 w-3" />}
                        {attendanceFormLoading ? "Saving..." : "Mark"}
                      </Button>
                    </form>
                  )}
                  {attendanceFormError && <p className="text-xs text-destructive">{attendanceFormError}</p>}

                  {!attendanceStaffId ? (
                    <p className="text-sm text-muted-foreground py-4">Select a staff member to view or mark attendance.</p>
                  ) : attendanceLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading attendance...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No attendance records for this month.</div>
                  ) : (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead><TableHead>Status</TableHead>
                            <TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map(a => (
                            <TableRow key={a.id}>
                              <TableCell>{String(a.date).slice(0, 10)}</TableCell>
                              <TableCell className="capitalize">{a.status.replace("_", " ")}</TableCell>
                              <TableCell>{a.check_in ?? "—"}</TableCell>
                              <TableCell>{a.check_out ?? "—"}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{a.notes ?? ""}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ Members Tab ══ */}
          {activeTab === "members" && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Active", value: memberships.filter(m => m.status === "active").length, color: "text-green-500" },
                  { label: "Expired", value: memberships.filter(m => m.status === "expired").length, color: "text-destructive" },
                  { label: "Total Sessions", value: memberships.reduce((s, m) => s + m.sessions_total, 0), color: "text-primary" },
                  { label: "Used Sessions", value: memberships.reduce((s, m) => s + m.sessions_used, 0), color: "text-yellow-500" },
                ].map(card => (
                  <div key={card.label} className="bg-card rounded-xl p-3 border border-border text-center">
                    <p className={`text-lg sm:text-xl font-black ${card.color}`}>{card.value}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {MEMBERSHIP_STATUS_FILTERS.map(s => (
                  <Button key={s} variant={memberFilter === s ? "default" : "outline"} size="sm" className="flex-shrink-0" onClick={() => setMemberFilter(s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Memberships</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowAddMembership(v => !v)}>
                    {showAddMembership ? "Cancel" : "+ Add Membership"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddMembership && (
                    <form onSubmit={handleCreateMembership} className="rounded-lg border border-primary/30 p-4 space-y-4">
                      <h3 className="font-bold text-primary">New Membership</h3>

                      {/* Package selector */}
                      <div className="grid grid-cols-3 gap-2">
                        {MEMBERSHIP_PACKAGES.map(pkg => (
                          <button
                            type="button"
                            key={pkg.key}
                            onClick={() => setNewMembership(p => ({ ...p, package_type: pkg.key, sessions_total: pkg.sessions, price_paid: pkg.price }))}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              newMembership.package_type === pkg.key ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <p className="font-bold text-sm">{pkg.label}</p>
                            <p className="text-primary text-xs">{fmt(pkg.price)}</p>
                            <p className="text-muted-foreground text-xs">{pkg.sessions} sessions</p>
                          </button>
                        ))}
                      </div>

                      {/* Client search */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Client Mobile or Name *</label>
                        <div className="flex gap-2">
                          <Input
                            value={membershipClientQuery}
                            onChange={e => setMembershipClientQuery(e.target.value)}
                            placeholder="Search by mobile or name"
                          />
                          <Button type="button" variant="outline" disabled={membershipClientSearching} onClick={searchMembershipClient}>
                            {membershipClientSearching ? <Spinner className="h-3.5 w-3.5" /> : "Find"}
                          </Button>
                        </div>
                        {newMembership.client_name && (
                          <p className="text-green-500 text-xs mt-1">✓ {newMembership.client_name} ({newMembership.client_mobile})</p>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Sessions</label>
                          <Input type="number" min={1} value={newMembership.sessions_total} onChange={e => setNewMembership(p => ({ ...p, sessions_total: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Price Paid (₹)</label>
                          <Input type="number" min={0} value={newMembership.price_paid} onChange={e => setNewMembership(p => ({ ...p, price_paid: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Start Date</label>
                          <Input type="date" value={newMembership.start_date} onChange={e => setNewMembership(p => ({ ...p, start_date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">End Date</label>
                          <Input type="date" value={newMembership.end_date} onChange={e => setNewMembership(p => ({ ...p, end_date: e.target.value }))} />
                        </div>
                      </div>

                      {membershipFormError && <p className="text-sm text-destructive">{membershipFormError}</p>}
                      <Button type="submit" disabled={membershipFormLoading || !newMembership.client_id || !newMembership.package_type} className="flex items-center gap-2">
                        {membershipFormLoading && <Spinner />}
                        {membershipFormLoading ? "Creating..." : "Create Membership"}
                      </Button>
                    </form>
                  )}

                  {membershipsLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading memberships...</div>
                  ) : memberships.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No memberships yet. Add one above.</div>
                  ) : (
                    <div className="space-y-3">
                      {memberships.map(m => {
                        const pct = m.sessions_total > 0 ? Math.round((m.sessions_used / m.sessions_total) * 100) : 0;
                        const isExpiring = m.status === "active" && new Date(m.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        return (
                          <div key={m.id} className={`rounded-xl border p-4 ${m.status === "active" ? (isExpiring ? "border-yellow-500/40" : "border-border") : "border-destructive/20 opacity-70"}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold">{m.client_name}</p>
                                <p className="text-muted-foreground text-sm">{m.client_mobile}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">{m.package_name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === "active" ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"}`}>
                                    {m.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black">{m.sessions_remaining}</p>
                                <p className="text-muted-foreground text-xs">sessions left</p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{m.sessions_used} used</span>
                                <span>{m.sessions_total} total</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-destructive" : pct >= 60 ? "bg-yellow-500" : "bg-primary"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground mb-3">
                              <span>{new Date(m.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              <span>→</span>
                              <span className={isExpiring ? "text-yellow-500 font-bold" : ""}>
                                {new Date(m.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {isExpiring && " ⚠"}
                              </span>
                            </div>

                            {m.status === "active" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  disabled={m.sessions_remaining <= 0}
                                  onClick={() => { setUseSessionMembershipId(m.id); setUseSessionServiceType(""); }}
                                >
                                  ✓ Use Session
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => toggleMembershipPause(m.id, m.status)}>Pause</Button>
                              </div>
                            )}
                            {m.status === "paused" && (
                              <Button size="sm" variant="outline" className="w-full" onClick={() => toggleMembershipPause(m.id, m.status)}>
                                Resume Membership
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Use-session service picker modal */}
          {useSessionMembershipId && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={() => setUseSessionMembershipId(null)}>
              <div className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-3">Log Session Usage</h3>
                <label className="text-sm font-medium mb-1 block">Service Used</label>
                <select
                  value={useSessionServiceType}
                  onChange={e => setUseSessionServiceType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
                >
                  <option value="">Select service...</option>
                  {Object.entries(SERVICE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={!useSessionServiceType} onClick={confirmUseSession}>Confirm</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setUseSessionMembershipId(null)}>Cancel</Button>
                </div>
              </div>
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

function BookingEditForm({ booking, apiUrl, adminKey, onSaved, onCancel }: {
  booking: Booking;
  apiUrl: string;
  adminKey: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    status: booking.status,
    payment_status: booking.payment_status,
    service_type: booking.service_type,
    date: String(booking.date).slice(0, 10),
    time_slot: booking.time_slot,
    notes: booking.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(errBody.detail ?? `Error ${res.status}`);
      }
      onSaved();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to save booking"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-3 py-2">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as BookingStatus }))}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {BOOKING_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Payment Status</label>
          <select
            value={form.payment_status}
            onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as PaymentStatus }))}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Service Type</label>
          <Input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Date</label>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Time Slot</label>
          <Input value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} className="h-8 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Notes</label>
        <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-8 text-sm" />
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-1.5">
          {saving && <Spinner className="h-3 w-3" />}
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function PayrollEditForm({ record, apiUrl, adminKey, onSaved, onCancel }: {
  record: PayrollRecord;
  apiUrl: string;
  adminKey: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    days_worked: String(record.days_worked),
    amount_paid: String(record.amount_paid),
    notes: record.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${apiUrl}/api/payroll/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({
          days_worked: parseInt(form.days_worked) || 0,
          amount_paid: parseInt(form.amount_paid) || 0,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(errBody.detail ?? `Error ${res.status}`);
      }
      onSaved();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Days Worked</label><Input type="number" min={0} value={form.days_worked} onChange={e => setForm(f => ({ ...f, days_worked: e.target.value }))} className="h-8 text-sm" /></div>
        <div><label className="text-xs font-medium mb-1 block">Amount Paid (₹)</label><Input type="number" min={0} value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} className="h-8 text-sm" /></div>
      </div>
      <div><label className="text-xs font-medium mb-1 block">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-8 text-sm" /></div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-1.5">
          {saving && <Spinner className="h-3 w-3" />}
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
  if (status === "completed") return <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  if (status === "no_show") return <Badge variant="destructive">No Show</Badge>;
  if (status === "postponed") return <Badge variant="outline" className="text-orange-700 border-orange-300">Postponed</Badge>;
  return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Pending</Badge>;
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (status === "paid") return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Paid</Badge>;
  if (status === "refunded") return <Badge variant="outline" className="text-purple-700 border-purple-300">Refunded</Badge>;
  if (status === "partial") return <Badge variant="outline" className="text-orange-700 border-orange-300">Partial</Badge>;
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
