import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChefHat, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername) return;
    setForgotLoading(true);
    setRecoveredPassword(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setRecoveredPassword(data.password);
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotUsername || !resetNewPassword) return;
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setResetDone(true);
        toast({ title: "Password Reset", description: "Your password has been updated. You can now log in." });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-none border-border shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-secondary flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl text-primary">Trey Baker</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="input-login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="rounded-none border-muted"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setForgotOpen(true); setForgotUsername(""); setRecoveredPassword(null); setShowReset(false); setResetNewPassword(""); setResetDone(false); }}
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                data-testid="input-login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-none border-muted"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-none"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-none sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif">{showReset ? "Reset Password" : "Forgot Password"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {showReset ? "Enter your username and choose a new password." : "Enter your username to recover or reset your password."}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="forgot-username">Username</Label>
              <Input
                id="forgot-username"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                placeholder="Enter your username"
                className="rounded-none border-muted"
                data-testid="input-forgot-username"
              />
            </div>
            {showReset && !resetDone && (
              <div className="grid gap-2">
                <Label htmlFor="reset-new-password">New Password</Label>
                <Input
                  id="reset-new-password"
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 characters)"
                  className="rounded-none border-muted"
                  data-testid="input-reset-new-password"
                />
              </div>
            )}
            {recoveredPassword && (
              <div className="p-4 bg-muted/30 border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Your password is:</p>
                <p className="font-mono text-lg font-bold text-primary" data-testid="text-recovered-password">{recoveredPassword}</p>
              </div>
            )}
            {resetDone && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
                Password has been reset successfully. You can now log in with your new password.
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {resetDone ? (
              <Button
                onClick={() => { setForgotOpen(false); setUsername(forgotUsername); setPassword(""); }}
                className="rounded-none w-full"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            ) : recoveredPassword ? (
              <Button
                onClick={() => { setForgotOpen(false); setUsername(forgotUsername); setPassword(""); }}
                className="rounded-none w-full"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            ) : showReset ? (
              <Button
                onClick={handleResetPassword}
                className="rounded-none w-full"
                disabled={!forgotUsername || resetNewPassword.length < 4 || resetLoading}
                data-testid="button-confirm-reset"
              >
                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Set New Password
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleForgotPassword}
                  className="rounded-none w-full"
                  disabled={!forgotUsername || forgotLoading}
                  data-testid="button-recover-password"
                >
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Recover Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReset(true)}
                  className="rounded-none w-full"
                  data-testid="button-reset-password"
                >
                  Reset Password Instead
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
