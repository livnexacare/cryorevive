import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <>
        <SEO title="Password Reset - CryoRevive" />
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center p-4 pt-24">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Password Updated!</h2>
              <p className="text-muted-foreground">
                Your password has been reset. Redirecting to login…
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (!ready) {
    return (
      <>
        <SEO title="Reset Password - CryoRevive" />
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center p-4 pt-24">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-muted-foreground">
                Waiting for reset link… Please click the link in your email.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO title="Reset Password - CryoRevive" />
      <Navigation />
      <main className="min-h-screen bg-background flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>Enter and confirm your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
