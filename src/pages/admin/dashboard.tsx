import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";

const SERVICE_LABELS: Record<string, string> = {
  ice_bath: "Ice Bath",
  steam_sauna: "Steam Sauna",
  contrast_therapy: "Contrast Therapy",
  mobile_unit: "Mobile Unit",
};

type BookingStatus = "pending" | "confirmed" | "cancelled";

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

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth !== "true") {
      router.push("/admin");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

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
      .then((data) => { if (!cancelled) setBookings(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, statusFilter, dateFilter, tick]);

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

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
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
              <p className="text-sm text-muted-foreground">Bookings Management</p>
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
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today}</div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
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
                            <TableCell>
                              <StatusBadge status={b.status} />
                            </TableCell>
                            <TableCell>
                              <PaymentBadge status={b.payment_status} />
                            </TableCell>
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
