import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface StaffLoginResponse {
  success: boolean;
  staff_id: string;
  username: string;
  full_name: string;
  role: string;
}

export default function StaffLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("cryo_staff")) {
      router.push("/staff/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<StaffLoginResponse>("/api/staff/login", {
        method: "POST",
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      });
      sessionStorage.setItem("cryo_staff", "true");
      sessionStorage.setItem(
        "cryo_staff_info",
        JSON.stringify({
          staff_id: data.staff_id,
          username: data.username,
          full_name: data.full_name,
          role: data.role,
        })
      );
      router.push("/staff/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Staff Access — CryoRevive" />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">CryoRevive Staff</CardTitle>
            <CardDescription>Sign in to manage clients and bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-center mt-6">
              <a href="/" className="text-muted-foreground text-xs hover:text-foreground">
                ← Back to site
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
