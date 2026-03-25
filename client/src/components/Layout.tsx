import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, ChefHat } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background fixed top-0 left-0 right-0 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <ChefHat className="h-5 w-5 text-primary" />
        <span className="font-serif font-bold text-primary">Trey Baker</span>
      </div>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 pt-14 md:pt-0 px-4 md:px-8 py-4 md:py-8 min-h-screen bg-background">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
