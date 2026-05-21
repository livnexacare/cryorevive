import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, MapPin, Snowflake, Flame, Activity } from "lucide-react";
import { API_URL, parseTimeSlot } from "@/lib/api";

const IN_CENTRE_SERVICES = [
  { 
    id: "ice-bath", 
    name: "Ice Bath", 
    price: 500, 
    duration: "15 min",
    icon: Snowflake,
    description: "Cold plunge therapy for recovery and inflammation reduction"
  },
  { 
    id: "sauna", 
    name: "Steam Sauna", 
    price: 600, 
    duration: "20 min",
    icon: Flame,
    description: "Heat therapy for detoxification and relaxation"
  },
  { 
    id: "contrast", 
    name: "Contrast Therapy", 
    price: 900, 
    duration: "30 min",
    icon: Activity,
    description: "Alternating hot and cold therapy for maximum recovery"
  }
];

const TIME_SLOTS = [
  "05:00 AM - 06:00 AM",
  "06:00 AM - 08:00 AM",
  "08:00 AM - 10:00 AM", 
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
  "08:00 PM - 10:00 PM"
];

const EVENT_TYPES = [
  "Marathon / Running Event",
  "Triathlon",
  "Cycling Race",
  "CrossFit Competition",
  "Sports Tournament",
  "Other Athletic Event"
];

export default function Booking() {
  const [activeTab, setActiveTab] = useState("centre");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // In-Centre Session State
  const [selectedService, setSelectedService] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");

  // Mobile Event State
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [expectedAthletes, setExpectedAthletes] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("current_user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const calculateEventAmount = () => {
    const athleteCount = parseInt(expectedAthletes) || 0;
    
    const pricingTiers = JSON.parse(localStorage.getItem("pricing_tiers") || JSON.stringify([
      { minAthletes: 0, maxAthletes: 99, basePrice: 10000, perAthletePrice: 799 },
      { minAthletes: 100, maxAthletes: 499, basePrice: 10000, perAthletePrice: 499 },
      { minAthletes: 500, maxAthletes: 10000, basePrice: 5000, perAthletePrice: 399 }
    ]));

    const tier = pricingTiers.find((t: any) => 
      athleteCount >= t.minAthletes && athleteCount <= t.maxAthletes
    );

    if (!tier) return 0;
    return tier.basePrice + (athleteCount * tier.perAthletePrice);
  };

  const getEventPricingBreakdown = () => {
    const athleteCount = parseInt(expectedAthletes) || 0;
    
    const pricingTiers = JSON.parse(localStorage.getItem("pricing_tiers") || JSON.stringify([
      { minAthletes: 0, maxAthletes: 99, basePrice: 10000, perAthletePrice: 799 },
      { minAthletes: 100, maxAthletes: 499, basePrice: 10000, perAthletePrice: 499 },
      { minAthletes: 500, maxAthletes: 10000, basePrice: 5000, perAthletePrice: 399 }
    ]));

    const tier = pricingTiers.find((t: any) => 
      athleteCount >= t.minAthletes && athleteCount <= t.maxAthletes
    );

    if (!tier) return null;

    return {
      basePrice: tier.basePrice,
      perAthletePrice: tier.perAthletePrice,
      athleteCount: athleteCount
    };
  };

  const handleCentreBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const service = IN_CENTRE_SERVICES.find(s => s.id === selectedService);
    if (!service) return;

    const bookingData = {
      id: Date.now().toString(),
      type: "centre",
      serviceName: service.name,
      servicePrice: service.price,
      date: sessionDate,
      timeSlot: sessionTime,
      customerName: (e.target as any).customerName.value,
      customerPhone: (e.target as any).customerPhone.value,
      customerEmail: (e.target as any).customerEmail.value,
      notes: (e.target as any).notes.value,
      status: "pending",
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || null
    };

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: service.price * 100, // Convert to paise
          currency: "INR",
          receipt: `centre_${bookingData.id}`
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "CryoRevive by Livnexa",
        description: `${service.name} - In-Centre Session`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Persist to backend
              try {
                const serviceTypeMap: Record<string, string> = {
                  "ice-bath": "ice_bath",
                  "sauna": "steam_sauna",
                  "contrast": "contrast_therapy",
                };
                await fetch(`${API_URL}/api/bookings`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: bookingData.customerName,
                    email: bookingData.customerEmail,
                    phone: bookingData.customerPhone,
                    service_type: serviceTypeMap[selectedService] || "ice_bath",
                    date: bookingData.date,
                    time_slot: parseTimeSlot(bookingData.timeSlot),
                    notes: bookingData.notes || `Order: ${response.razorpay_order_id}`,
                  }),
                });
              } catch (_) {
                // Non-fatal — payment confirmed
              }

              // Cache locally for account page
              const allBookings = JSON.parse(localStorage.getItem("centre_bookings") || "[]");
              allBookings.push({
                ...bookingData,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                status: "confirmed"
              });
              localStorage.setItem("centre_bookings", JSON.stringify(allBookings));

              alert(`Payment successful! Booking confirmed.\nPayment ID: ${response.razorpay_payment_id}`);

              if (currentUser) {
                window.location.href = "/account";
              } else {
                (e.target as any).reset();
                setSelectedService("");
                setSessionDate("");
                setSessionTime("");
              }
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerPhone
        },
        theme: {
          color: "#33B5E5"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to process booking. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleEventBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const bookingData = {
      id: Date.now().toString(),
      type: "mobile-event",
      eventName: (e.target as any).eventName.value,
      eventType,
      eventDate,
      eventTime,
      location: (e.target as any).eventLocation.value,
      athleteCount: parseInt(expectedAthletes),
      organizerName: (e.target as any).organizerName.value,
      organizerPhone: (e.target as any).organizerPhone.value,
      organizerEmail: (e.target as any).organizerEmail.value,
      specialRequirements: (e.target as any).specialRequirements.value,
      totalAmount: calculateEventAmount(),
      status: "pending",
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || null
    };

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: bookingData.totalAmount * 100,
          currency: "INR",
          receipt: `event_${bookingData.id}`
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "CryoRevive by Livnexa",
        description: `Mobile Event Recovery - ${bookingData.eventName}`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Persist to backend
              try {
                await fetch(`${API_URL}/api/bookings`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: bookingData.organizerName,
                    email: bookingData.organizerEmail,
                    phone: bookingData.organizerPhone,
                    service_type: "mobile_unit",
                    date: bookingData.eventDate,
                    time_slot: parseTimeSlot(bookingData.eventTime),
                    notes: [
                      bookingData.eventName,
                      bookingData.eventType,
                      bookingData.location,
                      `${bookingData.athleteCount} athletes`,
                      `Order: ${response.razorpay_order_id}`,
                      bookingData.specialRequirements,
                    ].filter(Boolean).join(" | "),
                  }),
                });
              } catch (_) {
                // Non-fatal — payment confirmed
              }

              // Cache locally for account page
              const allBookings = JSON.parse(localStorage.getItem("event_bookings") || "[]");
              allBookings.push({
                ...bookingData,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                status: "confirmed"
              });
              localStorage.setItem("event_bookings", JSON.stringify(allBookings));

              alert(`Payment successful! Event booking confirmed.\nPayment ID: ${response.razorpay_payment_id}`);
              
              if (currentUser) {
                window.location.href = "/account";
              } else {
                (e.target as any).reset();
                setEventType("");
                setEventDate("");
                setEventTime("");
                setExpectedAthletes("");
              }
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: bookingData.organizerName,
          email: bookingData.organizerEmail,
          contact: bookingData.organizerPhone
        },
        notes: {
          event_name: bookingData.eventName,
          athletes: bookingData.athleteCount.toString()
        },
        theme: {
          color: "#33B5E5"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to process booking. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEO 
        title="Book Recovery Session | CryoRevive Booking"
        description="Book in-centre recovery sessions or mobile event recovery services. Ice bath, sauna, and contrast therapy with Razorpay secure payment."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Book Your Recovery
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Start Your Recovery Journey
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose in-centre sessions or book us for your athletic event. Secure payment with instant confirmation.
              </p>
            </div>
          </div>
        </section>

        {/* Booking Forms */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="centre" className="text-base">
                  In-Centre Sessions
                </TabsTrigger>
                <TabsTrigger value="mobile" className="text-base">
                  Mobile Event Booking
                </TabsTrigger>
              </TabsList>

              {/* In-Centre Session Tab */}
              <TabsContent value="centre">
                <Card className="bg-card border-primary/30">
                  <CardHeader className="border-b border-border">
                    <h2 className="text-2xl font-display font-bold">Book In-Centre Session</h2>
                    <p className="text-muted-foreground">
                      Schedule your recovery session at our facility
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Service Selection */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      {IN_CENTRE_SERVICES.map((service) => {
                        const Icon = service.icon;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => setSelectedService(service.id)}
                            className={`p-4 border-2 rounded-sm transition-all ${
                              selectedService === service.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Icon className={`h-8 w-8 mx-auto mb-3 ${
                              selectedService === service.id ? "text-primary" : "text-muted-foreground"
                            }`} />
                            <h3 className="font-display font-bold mb-1">{service.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{service.duration}</p>
                            <p className="text-lg font-bold text-primary">₹{service.price}</p>
                            <p className="text-xs text-muted-foreground mt-2">{service.description}</p>
                          </button>
                        );
                      })}
                    </div>

                    {selectedService && (
                      <form onSubmit={handleCentreBooking} className="space-y-6">
                        {/* Date & Time */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="sessionDate" className="text-sm font-semibold text-foreground">
                              Session Date *
                            </label>
                            <Input
                              id="sessionDate"
                              type="date"
                              value={sessionDate}
                              onChange={(e) => setSessionDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="sessionTime" className="text-sm font-semibold text-foreground">
                              Time Slot *
                            </label>
                            <select
                              id="sessionTime"
                              value={sessionTime}
                              onChange={(e) => setSessionTime(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                              required
                            >
                              <option value="">Select time slot</option>
                              {TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="customerName" className="text-sm font-semibold text-foreground">
                              Full Name *
                            </label>
                            <Input
                              id="customerName"
                              name="customerName"
                              type="text"
                              placeholder="John Doe"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="customerPhone" className="text-sm font-semibold text-foreground">
                                Phone Number *
                              </label>
                              <Input
                                id="customerPhone"
                                name="customerPhone"
                                type="tel"
                                placeholder="9891430920"
                                className="bg-background border-border"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="customerEmail" className="text-sm font-semibold text-foreground">
                                Email Address *
                              </label>
                              <Input
                                id="customerEmail"
                                name="customerEmail"
                                type="email"
                                placeholder="you@example.com"
                                className="bg-background border-border"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-semibold text-foreground">
                              Special Requests (Optional)
                            </label>
                            <Textarea
                              id="notes"
                              name="notes"
                              placeholder="Any special requirements or health concerns we should know about"
                              className="bg-background border-border min-h-[80px]"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing..." : `Pay ₹${IN_CENTRE_SERVICES.find(s => s.id === selectedService)?.price} - Proceed to Payment`}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mobile Event Booking Tab */}
              <TabsContent value="mobile">
                <Card className="bg-card border-primary/30">
                  <CardHeader className="border-b border-border">
                    <h2 className="text-2xl font-display font-bold">Book Mobile Event Recovery</h2>
                    <p className="text-muted-foreground">
                      Invite us to provide recovery services at your athletic event
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleEventBooking} className="space-y-6">
                      {/* Event Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="eventName" className="text-sm font-semibold text-foreground">
                            Event Name *
                          </label>
                          <Input
                            id="eventName"
                            name="eventName"
                            type="text"
                            placeholder="e.g., Delhi Half Marathon 2026"
                            className="bg-background border-border"
                            required
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="eventType" className="text-sm font-semibold text-foreground">
                              Event Type *
                            </label>
                            <select
                              id="eventType"
                              value={eventType}
                              onChange={(e) => setEventType(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                              required
                            >
                              <option value="">Select event type</option>
                              {EVENT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="eventDate" className="text-sm font-semibold text-foreground">
                              Event Date *
                            </label>
                            <Input
                              id="eventDate"
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="eventTime" className="text-sm font-semibold text-foreground">
                              Preferred Time Slot *
                            </label>
                            <select
                              id="eventTime"
                              value={eventTime}
                              onChange={(e) => setEventTime(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                              required
                            >
                              <option value="">Select time slot</option>
                              {TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="expectedAthletes" className="text-sm font-semibold text-foreground">
                              Expected Athletes *
                            </label>
                            <Input
                              id="expectedAthletes"
                              type="number"
                              min="1"
                              value={expectedAthletes}
                              onChange={(e) => setExpectedAthletes(e.target.value)}
                              placeholder="e.g., 150"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="eventLocation" className="text-sm font-semibold text-foreground">
                            Event Location *
                          </label>
                          <Input
                            id="eventLocation"
                            name="eventLocation"
                            type="text"
                            placeholder="Full event address"
                            className="bg-background border-border"
                            required
                          />
                        </div>
                      </div>

                      {/* Organizer Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-display font-bold">Organizer Contact</h3>
                        <div className="space-y-2">
                          <label htmlFor="organizerName" className="text-sm font-semibold text-foreground">
                            Organizer Name *
                          </label>
                          <Input
                            id="organizerName"
                            name="organizerName"
                            type="text"
                            placeholder="Your name"
                            className="bg-background border-border"
                            required
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="organizerPhone" className="text-sm font-semibold text-foreground">
                              Phone Number *
                            </label>
                            <Input
                              id="organizerPhone"
                              name="organizerPhone"
                              type="tel"
                              placeholder="9891430920"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="organizerEmail" className="text-sm font-semibold text-foreground">
                              Email Address *
                            </label>
                            <Input
                              id="organizerEmail"
                              name="organizerEmail"
                              type="email"
                              placeholder="you@example.com"
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="specialRequirements" className="text-sm font-semibold text-foreground">
                            Special Requirements (Optional)
                          </label>
                          <Textarea
                            id="specialRequirements"
                            name="specialRequirements"
                            placeholder="Any specific needs or requests for the event"
                            className="bg-background border-border min-h-[80px]"
                          />
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      {expectedAthletes && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            {(() => {
                              const breakdown = getEventPricingBreakdown();
                              if (!breakdown) return null;
                              
                              return (
                                <div className="text-sm text-muted-foreground">
                                  <strong className="text-foreground">Estimated Cost:</strong>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Base Event Fee:</span>
                                      <span>₹{breakdown.basePrice.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Per Athlete (₹{breakdown.perAthletePrice} × {breakdown.athleteCount}):</span>
                                      <span>₹{(breakdown.perAthletePrice * breakdown.athleteCount).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="pt-2 border-t border-primary/20 flex justify-between">
                                      <span className="font-bold text-foreground">Total Amount:</span>
                                      <span className="text-lg font-bold text-primary">
                                        ₹{calculateEventAmount().toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        disabled={isProcessing || !expectedAthletes}
                      >
                        {isProcessing ? "Processing..." : "Proceed to Payment (Razorpay)"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Location Info */}
        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-background border-border">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">
                      Visit Our Facility
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      B-94, Sector 36, Greater Noida, Uttar Pradesh
                      <br />
                      Mobile: 9891430920
                      <br />
                      Email: info@cryorevive.in, support@cryorevive.in
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href="tel:+919891430920"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-sm transition-colors"
                      >
                        Call: +91 9891430920
                      </a>
                      <a 
                        href="https://wa.me/919891430920?text=Hi%2C%20I%27d%20like%20to%20book%20a%20recovery%20session"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-sm transition-colors"
                      >
                        WhatsApp Us
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}