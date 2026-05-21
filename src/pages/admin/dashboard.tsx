import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LogOut, Search, Calendar, TrendingUp, Eye, CheckCircle2, XCircle, Clock, Settings } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  eventName: string;
  organizerName: string;
  email: string;
  phone: string;
  eventDate: string;
  timeSlot: string;
  athleteCount: number;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  paymentId?: string;
}

interface PricingTier {
  name: string;
  minAthletes: number;
  maxAthletes: number;
  basePrice: number;
  perAthletePrice: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { name: "Small Events", minAthletes: 0, maxAthletes: 99, basePrice: 10000, perAthletePrice: 799 },
    { name: "Medium Events", minAthletes: 100, maxAthletes: 499, basePrice: 10000, perAthletePrice: 499 },
    { name: "Large Events", minAthletes: 500, maxAthletes: 10000, basePrice: 5000, perAthletePrice: 399 }
  ]);

  useEffect(() => {
    const auth = localStorage.getItem("admin_authenticated");
    if (auth !== "true") {
      router.push("/admin");
      return;
    }
    setIsAuthenticated(true);
    const stored = localStorage.getItem("event_bookings");
    if (stored) {
      const data = JSON.parse(stored);
      setBookings(data);
      setFilteredBookings(data);
    }
    const savedPricing = localStorage.getItem("pricing_tiers");
    if (savedPricing) {
      setPricingTiers(JSON.parse(savedPricing));
    }
  }, [router]);

  const updatePricingTier = (index: number, field: keyof PricingTier, value: number) => {
    const updated = [...pricingTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPricingTiers(updated);
    localStorage.setItem("pricing_tiers", JSON.stringify(updated));
  };

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const updateBookingStatus = (id: string, newStatus: BookingStatus) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: newStatus } : b
    );
    setBookings(updated);
    localStorage.setItem("event_bookings", JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    router.push("/admin");
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    revenue: bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.amount, 0),
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "outline", icon: <Clock className="w-3 h-3 mr-1" /> },
      confirmed: { variant: "default", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
      completed: { variant: "secondary", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
      cancelled: { variant: "destructive", icon: <XCircle className="w-3 h-3 mr-1" /> },
    };

    const { variant, icon } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SEO title="Admin Dashboard - CryoRevive" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CryoRevive Admin</h1>
              <p className="text-sm text-muted-foreground">Event Bookings Management</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  View Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Stats Grid */}
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
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Management */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Event Pricing Configuration
                  </CardTitle>
                  <CardDescription>Set tiered pricing based on athlete count</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingTiers.map((tier, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block">{tier.name}</Label>
                          <p className="text-xs text-muted-foreground">
                            {tier.minAthletes} - {tier.maxAthletes === 10000 ? "500+" : tier.maxAthletes} athletes
                          </p>
                        </div>
                        <div>
                          <Label htmlFor={`base-${index}`} className="text-xs text-muted-foreground">Base Price</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">₹</span>
                            <Input
                              id={`base-${index}`}
                              type="number"
                              value={tier.basePrice}
                              onChange={(e) => updatePricingTier(index, "basePrice", parseInt(e.target.value))}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`per-athlete-${index}`} className="text-xs text-muted-foreground">Per Athlete</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">₹</span>
                            <Input
                              id={`per-athlete-${index}`}
                              type="number"
                              value={tier.perAthletePrice}
                              onChange={(e) => updatePricingTier(index, "perAthletePrice", parseInt(e.target.value))}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Example (50 athletes):</span>
                            <p className="font-semibold text-primary">
                              ₹{(tier.basePrice + (50 * tier.perAthletePrice)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-muted-foreground">
                  Pricing changes apply immediately to new bookings. Contact form will use these rates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>View and manage all event bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by event, organizer, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bookings Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Athletes</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.eventName}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.organizerName}</div>
                              <div className="text-sm text-muted-foreground">{booking.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{new Date(booking.eventDate).toLocaleDateString()}</div>
                              <div className="text-sm text-muted-foreground">{booking.timeSlot}</div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.athleteCount}</TableCell>
                          <TableCell className="font-medium">₹{booking.amount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Booking Details</DialogTitle>
                                  <DialogDescription>
                                    Booking ID: {booking.id}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedBooking && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Event Name</Label>
                                        <p className="font-medium">{selectedBooking.eventName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Organizer</Label>
                                        <p className="font-medium">{selectedBooking.organizerName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{selectedBooking.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p className="font-medium">{selectedBooking.phone}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Event Date</Label>
                                        <p className="font-medium">
                                          {new Date(selectedBooking.eventDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Time Slot</Label>
                                        <p className="font-medium">{selectedBooking.timeSlot}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Athletes</Label>
                                        <p className="font-medium">{selectedBooking.athleteCount}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Amount</Label>
                                        <p className="font-medium">₹{selectedBooking.amount.toLocaleString()}</p>
                                      </div>
                                      {selectedBooking.paymentId && (
                                        <div className="col-span-2">
                                          <Label className="text-muted-foreground">Payment ID</Label>
                                          <p className="font-mono text-sm">{selectedBooking.paymentId}</p>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <Label className="text-muted-foreground mb-2 block">Update Status</Label>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant={selectedBooking.status === "pending" ? "default" : "outline"}
                                          onClick={() => updateBookingStatus(selectedBooking.id, "pending")}
                                        >
                                          Pending
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selectedBooking.status === "confirmed" ? "default" : "outline"}
                                          onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selectedBooking.status === "completed" ? "default" : "outline"}
                                          onClick={() => updateBookingStatus(selectedBooking.id, "completed")}
                                        >
                                          Complete
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selectedBooking.status === "cancelled" ? "destructive" : "outline"}
                                          onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}