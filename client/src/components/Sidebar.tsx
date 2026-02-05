import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Calculator, Settings, ChefHat, User, LogOut, Bell } from "lucide-react";
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

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/pricing", label: "Price Calculator", icon: Calculator },
  ];

  const handleSettingClick = (setting: string) => {
    toast({
      title: "Settings",
      description: `${setting} settings will be available in the full version.`,
    });
  };

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary text-primary-foreground p-2 rounded-none">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-sidebar-foreground tracking-tight leading-none">
              Trey Baker
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
              Management
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href}>
              <a 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                {link.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer group flex-1 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-serif font-bold group-hover:ring-2 ring-primary/20 transition-all">
                  JD
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">Jean Dupont</p>
                  <p className="text-xs text-muted-foreground truncate">Head Baker</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none font-sans">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSettingClick("Profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingClick("Notifications")} className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingClick("Bakery")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Bakery Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-sidebar-accent rounded-none transition-colors group">
                <Settings className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none">
              <DropdownMenuItem onClick={() => handleSettingClick("General")} className="cursor-pointer">General Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingClick("Security")} className="cursor-pointer">Security</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingClick("Billing")} className="cursor-pointer">Billing</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
