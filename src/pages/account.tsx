import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Mail, Phone, LogOut, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/api";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_type: string;
  date: string;
  time_slot: string;
  notes: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      try {
        const res = await fetch(
          `${API_URL}/api/bookings/user?email=${encodeURIComponent(session.user.email ?? "")}`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (res.ok) {
          const data = await res.json() as Booking[];
          setBookings(data);
        }
      } catch {
        // non-fatal — bookings section stays empty
      }

      setLoading(false);
    };

    getSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] ?? "default"}>{status}</Badge>;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((b) => {
    const d = new Date(b.date);
    return d >= today && b.status !== "cancelled" && b.status !== "completed";
  });

  const pastBookings = bookings.filter((b) => {
    const d = new Date(b.date);
    return d < today || b.status === "completed" || b.status === "cancelled";
  });

  const fullName = (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "Account";
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "";

  if (loading) {
    return (
      <>
        <SEO title="My Account - CryoRevive" />
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center pt-24">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <SEO title="My Account - CryoRevive" />
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* User Profile Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{fullName}</CardTitle>
                      {memberSince && (
                        <CardDescription>Member since {memberSince}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                    {(user.user_metadata?.["phone"] as string | undefined) && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {user.user_metadata["phone"] as string}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{bookings.length}</p>
                      <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent">{upcomingBookings.length}</p>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bookings List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Bookings */}
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">Upcoming Bookings</h2>
                {upcomingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                      <Link href="/booking">
                        <Button>Book Your First Session</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="capitalize">
                                {booking.service_type.replace(/_/g, " ")}
                              </CardTitle>
                              <CardDescription>Booking #{booking.id.slice(0, 8)}</CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.time_slot}</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Payment</span>
                            <Badge variant={booking.payment_status === "paid" ? "default" : "secondary"}>
                              {booking.payment_status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold mb-4">Past Bookings</h2>
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <Card key={booking.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="capitalize">
                                {booking.service_type.replace(/_/g, " ")}
                              </CardTitle>
                              <CardDescription>Booking #{booking.id.slice(0, 8)}</CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.time_slot}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
