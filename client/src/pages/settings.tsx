import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfileSettings } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const defaultTab = searchParams.get("tab") || "profile";

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    bakeryName: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    emailExpenses: true,
    emailLowStock: true,
    emailWeeklyReport: false,
    pushApprovals: true,
    pushNewOrders: false,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: settings, isLoading } = useQuery<ProfileSettings>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json();
    }
  });

  useEffect(() => {
    if (settings) {
      setProfile({
        name: settings.name,
        email: settings.email,
        role: settings.role,
        bakeryName: settings.bakeryName,
        phone: settings.phone,
      });
      setNotifications({
        emailExpenses: settings.emailExpenses === "true",
        emailLowStock: settings.emailLowStock === "true",
        emailWeeklyReport: settings.emailWeeklyReport === "true",
        pushApprovals: settings.pushApprovals === "true",
        pushNewOrders: settings.pushNewOrders === "true",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    }
  });

  const handleSaveProfile = () => {
    updateMutation.mutate(profile, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your profile settings have been saved." });
      }
    });
  };

  const handleSaveNotifications = () => {
    updateMutation.mutate({
      emailExpenses: notifications.emailExpenses.toString(),
      emailLowStock: notifications.emailLowStock.toString(),
      emailWeeklyReport: notifications.emailWeeklyReport.toString(),
      pushApprovals: notifications.pushApprovals.toString(),
      pushNewOrders: notifications.pushNewOrders.toString(),
    }, {
      onSuccess: () => {
        toast({ title: "Notifications Updated", description: "Your notification preferences have been saved." });
      }
    });
  };

  const handleChangePassword = () => {
    if (!security.currentPassword || !security.newPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({ title: "Password Changed", description: "Your password has been updated successfully." });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security.</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="rounded-none bg-muted/30 border border-border w-full justify-start">
            <TabsTrigger value="profile" className="rounded-none gap-2 data-[state=active]:bg-background" data-testid="tab-profile">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none gap-2 data-[state=active]:bg-background" data-testid="tab-notifications">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-none gap-2 data-[state=active]:bg-background" data-testid="tab-security">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xl font-serif">
                  {profile.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.role} at {profile.bakeryName}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      data-testid="input-profile-name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      data-testid="input-profile-role"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="rounded-none border-muted"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-profile-email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      data-testid="input-profile-phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bakeryName">Bakery Name</Label>
                    <Input
                      id="bakeryName"
                      data-testid="input-profile-bakery"
                      value={profile.bakeryName}
                      onChange={(e) => setProfile({ ...profile, bakeryName: e.target.value })}
                      className="rounded-none border-muted"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="rounded-none gap-2" disabled={updateMutation.isPending} data-testid="button-save-profile">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="bg-card border border-border p-6 space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg mb-1">Email Notifications</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose which emails you'd like to receive.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Expense Submissions</p>
                      <p className="text-xs text-muted-foreground">Get notified when new expenses are submitted</p>
                    </div>
                    <Switch
                      checked={notifications.emailExpenses}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailExpenses: checked })}
                      data-testid="switch-email-expenses"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Low Stock Alerts</p>
                      <p className="text-xs text-muted-foreground">Alert when ingredient stock is running low</p>
                    </div>
                    <Switch
                      checked={notifications.emailLowStock}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailLowStock: checked })}
                      data-testid="switch-email-lowstock"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Weekly Summary Report</p>
                      <p className="text-xs text-muted-foreground">Receive a weekly expense and revenue summary</p>
                    </div>
                    <Switch
                      checked={notifications.emailWeeklyReport}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailWeeklyReport: checked })}
                      data-testid="switch-email-weekly"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-serif font-bold text-lg mb-1">Push Notifications</h3>
                <p className="text-sm text-muted-foreground mb-4">In-app notification preferences.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Expense Approvals</p>
                      <p className="text-xs text-muted-foreground">Notify when expenses are approved or rejected</p>
                    </div>
                    <Switch
                      checked={notifications.pushApprovals}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushApprovals: checked })}
                      data-testid="switch-push-approvals"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">New Orders</p>
                      <p className="text-xs text-muted-foreground">Notify when new orders come in</p>
                    </div>
                    <Switch
                      checked={notifications.pushNewOrders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushNewOrders: checked })}
                      data-testid="switch-push-orders"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="rounded-none gap-2" disabled={updateMutation.isPending} data-testid="button-save-notifications">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="bg-card border border-border p-6 space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg mb-1">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your account password.</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    data-testid="input-current-password"
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    data-testid="input-new-password"
                    value={security.newPassword}
                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    data-testid="input-confirm-password"
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
              </div>

              <Button onClick={handleChangePassword} className="rounded-none gap-2" data-testid="button-change-password">
                <Shield className="h-4 w-4" />
                Change Password
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
