import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";

export default function StaffLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("cryo_staff")) {
      router.push("/staff/dashboard");
    }
  }, [router]);

  const checkPin = (p: string) => {
    const STAFF_PIN = process.env.NEXT_PUBLIC_STAFF_PIN || "1234";
    if (p === STAFF_PIN) {
      sessionStorage.setItem("cryo_staff", "true");
      router.push("/staff/dashboard");
    } else {
      setShake(true);
      setError("Incorrect PIN");
      setTimeout(() => {
        setPin("");
        setError("");
        setShake(false);
      }, 800);
    }
  };

  const handleNumber = (num: number | string) => {
    if (num === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => checkPin(newPin), 100);
    }
  };

  return (
    <>
      <SEO title="Staff Access — CryoRevive" />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold">CryoRevive</h1>
            <p className="text-primary text-sm mt-1 tracking-widest uppercase">
              Staff Access
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-muted-foreground text-sm text-center mb-6">
              Enter Staff PIN
            </p>

            <div className={`flex justify-center gap-4 mb-6 ${shake ? "animate-bounce" : ""}`}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    pin.length > i ? "bg-primary border-primary" : "border-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((num, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => num !== "" && handleNumber(num)}
                  className={`h-16 rounded-lg text-xl font-bold transition-all active:scale-95 ${
                    num === ""
                      ? "invisible"
                      : num === "⌫"
                      ? "bg-secondary text-destructive hover:bg-secondary/70"
                      : "bg-secondary text-foreground hover:bg-secondary/70 active:bg-primary/20"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {error && <p className="text-destructive text-sm text-center mt-4">{error}</p>}
          </div>

          <p className="text-center mt-6">
            <a href="/" className="text-muted-foreground text-xs hover:text-foreground">
              ← Back to site
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
