import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Calculator, Settings, ChefHat, User, Bell, LogOut, Package, CakeSlice, Shield, Users, ClipboardList, ReceiptText, FlaskConical, BarChart3, FileSignature } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const displayName = user?.displayName || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("");

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/ingredients", label: "Ingredients", icon: Package },
    { href: "/menu-items", label: "Menu Items", icon: CakeSlice },
    { href: "/orders", label: "Orders", icon: ClipboardList },
    { href: "/receipts", label: "Receipts", icon: ReceiptText },
    { href: "/production", label: "Production", icon: FlaskConical },
    { href: "/pricing", label: "Price Calculator", icon: Calculator },
    { href: "/contracts", label: "Contracts", icon: FileSignature },
    ...(user?.role === "Owner" || user?.role === "Manager" ? [{ href: "/reports", label: "Reports", icon: BarChart3 }] : []),
    ...(user?.role === "Owner" ? [{ href: "/team", label: "Team", icon: Users }] : []),
  ];

  return (
    <div
      className={cn(
        "h-screen w-64 bg-background border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-8 pb-4 hidden md:block">
        <div className="flex items-center gap-3 mb-8">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-xl font-bold tracking-tight">Trey Baker</h1>
        </div>
      </div>

      <div className="md:hidden h-14 flex items-center px-8 border-b border-border">
        <div className="flex items-center gap-3">
          <ChefHat className="h-5 w-5 text-primary" />
          <span className="font-serif font-bold tracking-tight">Trey Baker</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                isActive ? "bg-secondary text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
              )}
              data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors group">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.role || "Staff"}</p>
              </div>
              <Settings className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-none">
            <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setLocation("/settings?tab=profile"); onClose(); }}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLocation("/settings?tab=notifications"); onClose(); }}>
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLocation("/settings?tab=security"); onClose(); }}>
              <Shield className="mr-2 h-4 w-4" /> Security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
