import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Calculator, Settings, ChefHat, User, Bell, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleAction = (title: string) => {
    toast({
      title,
      description: "Feature coming soon in the full version.",
    });
  };

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/pricing", label: "Price Calculator", icon: Calculator },
  ];

  return (
    <div className="h-screen w-64 bg-background border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-xl font-bold tracking-tight">Trey Baker</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <a className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                isActive ? "bg-secondary text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
              )}>
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors group">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Jean Dupont</p>
                <p className="text-[10px] text-muted-foreground truncate">Settings</p>
              </div>
              <Settings className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-none">
            <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("Profile Settings")}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("Notifications")}>
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("Security Settings")}>
              <Settings className="mr-2 h-4 w-4" /> Security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}