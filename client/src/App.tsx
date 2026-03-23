import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import ExpensesPage from "@/pages/expenses";
import PricingPage from "@/pages/pricing";
import IngredientsPage from "@/pages/ingredients";
import MenuItemsPage from "@/pages/menu-items";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import TeamPage from "@/pages/team";
import OrdersPage from "@/pages/orders";
import ReceiptsPage from "@/pages/receipts";
import ProductionPage from "@/pages/production";
import ReportsPage from "@/pages/reports";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>{() => { window.location.href = "/login"; return null; }}</Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/ingredients" component={IngredientsPage} />
      <Route path="/menu-items" component={MenuItemsPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route path="/production" component={ProductionPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/login">{() => { window.location.href = "/"; return null; }}</Route>
      <Route path="/register">{() => { window.location.href = "/"; return null; }}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <ProtectedRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
