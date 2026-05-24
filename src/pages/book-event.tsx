import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Truck, Users, Clock, MapPin } from "lucide-react";

const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "919891430920";

export default function BookEvent() {
  const [success, setSuccess] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [athletes, setAthletes] = useState("");
  const [location, setLocation] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [requirements, setRequirements] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = `🚐 *CryoRevive Mobile Event Booking Request*

*Event Name:* ${eventName}
*Event Type:* ${eventType}
*Event Date:* ${eventDate}
*Time Slot:* ${timeSlot}
*Expected Athletes:* ${athletes}
*Location:* ${location}

*Organizer Details*
*Name:* ${organizerName}
*Phone:* ${phone}
*Email:* ${email}${requirements ? `\n*Special Requirements:* ${requirements}` : ""}

Please contact me to discuss this event booking. Thank you!`.trim();

    window.open(
      `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    setSuccess(true);
  };

  return (
    <>
      <SEO
        title="Book Mobile Event | CryoRevive Recovery Unit"
        description="Bring CryoRevive's elite recovery technology to your gym, sports event, or team facility. Book our mobile recovery unit for on-site cold plunge and sauna."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-sm mb-6">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                Mobile Recovery Unit
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Book a Mobile Event
            </h1>
            <p className="text-lg text-muted-foreground">
              Bring elite cold plunge and sauna recovery to your gym, race, or team event. We handle the setup — you focus on performance.
            </p>
          </div>
        </section>

        {/* What we bring */}
        <section className="py-10 bg-background border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: Truck, label: "Mobile Setup", sub: "Full equipment on-site" },
                { icon: Users, label: "10–500+ Athletes", sub: "Scalable for any size" },
                { icon: Clock, label: "Flexible Timing", sub: "Around your schedule" },
                { icon: MapPin, label: "Greater Noida & NCR", sub: "Nearby regions too" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="bg-accent/10 w-12 h-12 rounded-sm flex items-center justify-center">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-16 bg-background">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            {success ? (
              <Card className="bg-card border-border">
                <CardContent className="py-16 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h2 className="text-2xl font-display font-bold">Request sent!</h2>
                  <p className="text-muted-foreground">
                    WhatsApp opened with your event details. We&apos;ll be in touch shortly to confirm.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSuccess(false)}
                    className="mt-2"
                  >
                    Submit Another Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-display font-bold mb-6">Event Details</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Event info */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="eventName" className="text-sm font-semibold text-foreground">
                          Event Name *
                        </label>
                        <Input
                          id="eventName"
                          type="text"
                          placeholder="Delhi Marathon 2025"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="eventType" className="text-sm font-semibold text-foreground">
                          Event Type *
                        </label>
                        <Input
                          id="eventType"
                          type="text"
                          placeholder="Marathon / Gym / Sports Meet"
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="eventDate" className="text-sm font-semibold text-foreground">
                          Event Date *
                        </label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="timeSlot" className="text-sm font-semibold text-foreground">
                          Preferred Time *
                        </label>
                        <Input
                          id="timeSlot"
                          type="text"
                          placeholder="e.g. 6:00 AM – 10:00 AM"
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="athletes" className="text-sm font-semibold text-foreground">
                          Expected Athletes *
                        </label>
                        <Input
                          id="athletes"
                          type="text"
                          placeholder="e.g. 50–100"
                          value={athletes}
                          onChange={(e) => setAthletes(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="location" className="text-sm font-semibold text-foreground">
                          Event Location *
                        </label>
                        <Input
                          id="location"
                          type="text"
                          placeholder="Venue name, city"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-5">
                      <h3 className="text-lg font-display font-bold mb-4">Organizer Details</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="organizerName" className="text-sm font-semibold text-foreground">
                            Full Name *
                          </label>
                          <Input
                            id="organizerName"
                            type="text"
                            placeholder="Your name"
                            value={organizerName}
                            onChange={(e) => setOrganizerName(e.target.value)}
                            className="bg-background border-border"
                            required
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                              WhatsApp Number *
                            </label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 98914 30920"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-foreground">
                              Email Address *
                            </label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-background border-border"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="requirements" className="text-sm font-semibold text-foreground">
                        Special Requirements (Optional)
                      </label>
                      <Textarea
                        id="requirements"
                        placeholder="Power supply needs, space constraints, specific equipment, anything else we should know…"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="bg-background border-border min-h-[80px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold"
                      disabled={
                        !eventName.trim() || !eventType.trim() || !eventDate ||
                        !timeSlot.trim() || !athletes.trim() || !location.trim() ||
                        !organizerName.trim() || phone.trim().length < 6 || !email.trim()
                      }
                    >
                      Send Event Request via WhatsApp
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      WhatsApp opens with your event details pre-filled — just hit send.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
