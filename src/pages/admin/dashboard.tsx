import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, Calendar, TrendingUp, CheckCircle2, Clock, Bell } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";

const SERVICE_LABELS: Record<string, string> = {
  ice_bath: "Ice Bath",
  steam_sauna: "Steam Sauna",
  contrast_therapy: "Contrast Therapy",
  cryo_chamber: "Cryo Chamber",
  mobile_unit: "Mobile Unit",
};

type BookingStatus = "pending" | "confirmed" | "cancelled";
type DashTab = "bookings" | "announcements";
type AnnouncementType = "general" | "offer" | "feature" | "event";

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
}

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;

const ANN_TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "offer", label: "Offer" },
  { value: "feature", label: "Feature Update" },
  { value: "event", label: "Event" },
];

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

  useEffect(() => {
    const auth = sessionStorage.getItem("cryo_admin");
    if (auth !== "true") {
      router.push("/admin");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Fetch bookings
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);

    fetch(`${API_URL}/api/bookings?${params}`, {
      headers: { "X-Admin-Key": ADMIN_KEY },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data: Booking[]) => { if (!cancelled) setBookings(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, statusFilter, dateFilter, tick]);

  // Fetch announcements
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setAnnLoading(true);
    setAnnError("");

    fetch(`${API_URL}/api/notifications/announcements`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data: Announcement[]) => { if (!cancelled) setAnnouncements(data); })
      .catch((e: Error) => { if (!cancelled) setAnnError(e.message); })
      .finally(() => { if (!cancelled) setAnnLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, annTick]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setTick((t) => t + 1);
    } catch {
      alert("Failed to update booking status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    setPostLoading(true);
    setPostSuccess("");
    setPostError("");

    try {
      const res = await fetch(`${API_URL}/api/notifications/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({
          title: annTitle.trim(),
          body: annBody.trim(),
          type: annType,
          expires_at: annExpiresAt || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setPostSuccess("Announcement posted!");
      setAnnTitle("");
      setAnnBody("");
      setAnnType("general");
      setAnnExpiresAt("");
      setAnnTick((t) => t + 1);
    } catch (e: unknown) {
      setPostError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPostLoading(false);
    }
  };

  const sendPush = async (id: string) => {
    setSendLoading(id);
    setSendResult((r) => ({ ...r, [id]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ announcement_id: id }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as { pushed: number };
      setSendResult((r) => ({ ...r, [id]: `Sent to ${data.pushed} device${data.pushed !== 1 ? "s" : ""}` }));
    } catch (e: unknown) {
      setSendResult((r) => ({ ...r, [id]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setSendLoading(null);
    }
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
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Failed to deactivate announcement.");
    } finally {
      setDeactivateLoading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cryo_admin");
    router.push("/admin");
  };

  const today = new Date().toISOString().split("T")[0];

  const filtered = bookings.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(term) || b.email.toLowerCase().includes(term);
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    today: bookings.filter((b) => String(b.date).startsWith(today)).length,
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
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "bookings"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="inline w-4 h-4 mr-1.5 -mt-0.5" />
              Bookings
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "announcements"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bell className="inline w-4 h-4 mr-1.5 -mt-0.5" />
              Announcements
            </button>
          </div>

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <Card>
              <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
                  <div className="flex gap-2">
                    {STATUS_FILTERS.map((s) => (
                      <Button
                        key={s}
                        variant={statusFilter === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(s)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="sm:w-[160px]"
                  />
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
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
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                              No bookings yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {b.id.slice(0, 8)}
                              </TableCell>
                              <TableCell className="font-medium">{b.name}</TableCell>
                              <TableCell>{b.email}</TableCell>
                              <TableCell>{b.phone}</TableCell>
                              <TableCell>{SERVICE_LABELS[b.service_type] ?? b.service_type}</TableCell>
                              <TableCell>{String(b.date).slice(0, 10)}</TableCell>
                              <TableCell>{b.time_slot}</TableCell>
                              <TableCell><StatusBadge status={b.status} /></TableCell>
                              <TableCell><PaymentBadge status={b.payment_status} /></TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(b.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {b.status === "pending" && (
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={actionLoading !== null}
                                      onClick={() => updateStatus(b.id, "confirmed")}
                                    >
                                      {actionLoading === b.id + "confirmed" ? "..." : "Confirm"}
                                    </Button>
                                  )}
                                  {(b.status === "pending" || b.status === "confirmed") && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={actionLoading !== null}
                                      onClick={() => updateStatus(b.id, "cancelled")}
                                    >
                                      {actionLoading === b.id + "cancelled" ? "..." : "Cancel"}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              {/* Create Form */}
              <Card>
                <CardHeader><CardTitle>Create Announcement</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={postAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title *</label>
                      <Input
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. 20% off Ice Bath this weekend"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Message *</label>
                      <textarea
                        value={annBody}
                        onChange={(e) => setAnnBody(e.target.value)}
                        placeholder="Write your announcement here..."
                        required
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <select
                          value={annType}
                          onChange={(e) => setAnnType(e.target.value as AnnouncementType)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {ANN_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Expires At (optional)</label>
                        <Input
                          type="datetime-local"
                          value={annExpiresAt}
                          onChange={(e) => setAnnExpiresAt(e.target.value)}
                        />
                      </div>
                    </div>

                    {postSuccess && (
                      <p className="text-sm font-medium text-green-600">{postSuccess}</p>
                    )}
                    {postError && (
                      <p className="text-sm font-medium text-destructive">{postError}</p>
                    )}

                    <Button type="submit" disabled={postLoading}>
                      {postLoading ? "Posting..." : "Post Announcement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Active Announcements List */}
              <Card>
                <CardHeader><CardTitle>Active Announcements</CardTitle></CardHeader>
                <CardContent>
                  {annLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading...</div>
                  ) : annError ? (
                    <div className="py-8 text-center text-destructive">{annError}</div>
                  ) : announcements.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No active announcements. Create one above.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold">{a.title}</p>
                                <TypeBadge type={a.type} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                <span>Created: {new Date(a.created_at).toLocaleString()}</span>
                                {a.expires_at && (
                                  <span>Expires: {new Date(a.expires_at).toLocaleString()}</span>
                                )}
                              </div>
                              {sendResult[a.id] && (
                                <p className="text-xs font-medium text-cyan-600 mt-1">{sendResult[a.id]}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendLoading === a.id}
                              onClick={() => sendPush(a.id)}
                            >
                              <Bell className="w-3.5 h-3.5 mr-1.5" />
                              {sendLoading === a.id ? "Sending..." : "Send Push Notification"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deactivateLoading === a.id}
                              onClick={() => deactivate(a.id)}
                            >
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
        </main>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "confirmed")
    return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Confirmed</Badge>;
  if (status === "cancelled")
    return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Pending</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid")
    return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Paid</Badge>;
  return <Badge variant="secondary">Unpaid</Badge>;
}

const TYPE_STYLES: Record<AnnouncementType, string> = {
  offer: "bg-amber-100 text-amber-800 border border-amber-200",
  feature: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  event: "bg-purple-100 text-purple-800 border border-purple-200",
  general: "bg-gray-100 text-gray-700 border border-gray-200",
};

const TYPE_LABELS: Record<AnnouncementType, string> = {
  offer: "Offer",
  feature: "Feature Update",
  event: "Event",
  general: "General",
};

function TypeBadge({ type }: { type: AnnouncementType }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.general;
  const label = TYPE_LABELS[type] ?? type;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
