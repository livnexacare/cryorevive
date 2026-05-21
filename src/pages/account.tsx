import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Mail, Phone, LogOut, Clock, MapPin, Users } from "lucide-react";

interface Booking {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  athleteCount: number;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: string;
}

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const currentUser = localStorage.getItem("current_user");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);

    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const userBookings = allBookings.filter((b: Booking) => b.userId === userData.id);
    setBookings(userBookings);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const upcomingBookings = bookings.filter(b => {
    const eventDate = new Date(b.eventDate);
    return eventDate >= new Date() && b.status !== "cancelled" && b.status !== "completed";
  });

  const pastBookings = bookings.filter(b => {
    const eventDate = new Date(b.eventDate);
    return eventDate < new Date() || b.status === "completed" || b.status === "cancelled";
  });

  if (!user) {
    return null;
  }

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
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>Member since {new Date(user.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.phone}</span>
                    </div>
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
                <h2 className="text-2xl font-display font-bold mb-4">Upcoming Events</h2>
                {upcomingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                      <Link href="/contact">
                        <Button>Book an Event</Button>
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
                              <CardTitle>{booking.eventName}</CardTitle>
                              <CardDescription>Booking #{booking.id.slice(0, 8)}</CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.eventTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.athleteCount} athletes</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Amount</span>
                            <span className="text-lg font-bold">₹{booking.totalAmount.toLocaleString()}</span>
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
                  <h2 className="text-2xl font-display font-bold mb-4">Past Events</h2>
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <Card key={booking.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{booking.eventName}</CardTitle>
                              <CardDescription>Booking #{booking.id.slice(0, 8)}</CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.athleteCount} athletes</span>
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