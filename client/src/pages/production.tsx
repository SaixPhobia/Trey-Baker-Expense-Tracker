import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChefHat, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MenuItem, Ingredient, MenuItemIngredient } from "@shared/schema";
import { useAuth } from "@/lib/auth";

export default function ProductionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "Owner" || user?.role === "Manager";

  const [quantities, setQuantities] = useState<Record<number, string>>({});

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      if (!res.ok) throw new Error("Failed to fetch menu items");
      return res.json();
    },
  });

  const { data: ingredients = [], isLoading: ingLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to fetch ingredients");
      return res.json();
    },
  });

  const { data: allLinks = [], isLoading: linksLoading } = useQuery<MenuItemIngredient[]>({
    queryKey: ["/api/all-menu-item-ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/all-menu-item-ingredients");
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json();
    },
  });

  const isLoading = itemsLoading || ingLoading || linksLoading;

  const batchMutation = useMutation({
    mutationFn: async (items: { menuItemId: number; quantity: number }[]) => {
      const res = await fetch("/api/production/log-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log production");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setQuantities({});
      toast({ title: "Production Logged", description: "Ingredient inventory has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const activeItems = useMemo(() =>
    menuItems.filter(item => {
      const qty = parseInt(quantities[item.id] || "0");
      return qty > 0;
    }),
    [menuItems, quantities]
  );

  const ingredientTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const item of menuItems) {
      const qty = parseInt(quantities[item.id] || "0");
      if (qty <= 0) continue;
      const links = allLinks.filter(l => l.menuItemId === item.id);
      for (const link of links) {
        totals[link.ingredientId] = (totals[link.ingredientId] || 0) + parseFloat(link.quantityNeeded) * qty;
      }
    }
    return totals;
  }, [menuItems, quantities, allLinks]);

  const usedIngredients = useMemo(() =>
    ingredients
      .filter(ing => ingredientTotals[ing.id] !== undefined)
      .map(ing => ({
        ing,
        needed: ingredientTotals[ing.id],
        current: parseFloat(ing.quantity),
        remaining: parseFloat(ing.quantity) - ingredientTotals[ing.id],
        sufficient: parseFloat(ing.quantity) >= ingredientTotals[ing.id],
      })),
    [ingredients, ingredientTotals]
  );

  const hasAnyQty = activeItems.length > 0;
  const hasShortfall = usedIngredients.some(r => !r.sufficient);

  const handleConfirm = () => {
    const items = activeItems.map(item => ({
      menuItemId: item.id,
      quantity: parseInt(quantities[item.id]),
    }));
    batchMutation.mutate(items);
  };

  const handleReset = () => setQuantities({});

  const setQty = (itemId: number, val: string) => {
    setQuantities(prev => ({ ...prev, [itemId]: val }));
  };

  const CATEGORIES = ["Food", "Drinks", "Seasonal Food", "Seasonal Drinks"];
  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: menuItems.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);
  const uncategorised = menuItems.filter(i => !CATEGORIES.includes(i.category ?? ""));
  if (uncategorised.length > 0) grouped.push({ cat: "Other", items: uncategorised });

  return (
    <Layout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1">Production Planner</h1>
          <p className="text-muted-foreground text-sm">
            Enter how many of each item you're making to see total ingredient usage before committing.
          </p>
        </div>
        {hasAnyQty && (
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-none" data-testid="button-reset-plan">
            <RotateCcw className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Item quantities */}
          <div className="space-y-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Batch Quantities</h2>
            {grouped.map(({ cat, items }) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
                <div className="space-y-2">
                  {items.map(item => {
                    const hasLinks = allLinks.some(l => l.menuItemId === item.id);
                    const qty = quantities[item.id] || "";
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 border ${parseInt(qty) > 0 ? "border-primary/40 bg-secondary/30" : "border-border bg-background"}`}
                        data-testid={`production-row-${item.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {!hasLinks && (
                            <p className="text-xs text-muted-foreground">No ingredients linked</p>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={qty}
                          onChange={(e) => setQty(item.id, e.target.value)}
                          className="rounded-none border-muted w-20 text-center h-8 text-sm"
                          disabled={!hasLinks || !canManage}
                          data-testid={`input-qty-${item.id}`}
                        />
                        <span className="text-xs text-muted-foreground w-6">pcs</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Ingredient usage summary */}
          <div className="space-y-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Ingredient Usage Preview</h2>

            {!hasAnyQty ? (
              <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
                Enter quantities on the left to see ingredient requirements here.
              </div>
            ) : usedIngredients.length === 0 ? (
              <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
                None of the selected items have linked ingredients.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {usedIngredients.map(({ ing, needed, current, remaining, sufficient }) => (
                    <div
                      key={ing.id}
                      className={`p-3 border flex items-center gap-3 ${sufficient ? "border-border bg-background" : "border-destructive/40 bg-destructive/5"}`}
                      data-testid={`usage-row-${ing.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          In stock: <span className="font-mono">{current.toFixed(2)} {ing.unit}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-semibold text-destructive">
                          −{needed.toFixed(2)} {ing.unit}
                        </p>
                        <p className={`text-xs font-mono ${sufficient ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                          → {remaining.toFixed(2)} left
                        </p>
                      </div>
                      <div className="shrink-0">
                        {sufficient
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <AlertTriangle className="h-4 w-4 text-destructive" />
                        }
                      </div>
                    </div>
                  ))}
                </div>

                {hasShortfall && (
                  <div className="flex items-center gap-2 p-3 border border-destructive/40 bg-destructive/5 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Some ingredients are insufficient. Inventory will be floored at 0 — consider adjusting quantities.</span>
                  </div>
                )}

                <div className="border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Production Summary</p>
                  {activeItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.id}`}>
                      <span>{item.name}</span>
                      <Badge variant="secondary" className="rounded-none font-mono">{quantities[item.id]} pcs</Badge>
                    </div>
                  ))}
                </div>

                {canManage && (
                  <Button
                    onClick={handleConfirm}
                    className="rounded-none w-full"
                    disabled={batchMutation.isPending}
                    data-testid="button-confirm-batch"
                  >
                    {batchMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Logging...</>
                      : <><ChefHat className="h-4 w-4 mr-2" /> Log Production & Deduct Inventory</>
                    }
                  </Button>
                )}
                {!canManage && (
                  <p className="text-xs text-muted-foreground text-center">Only Owners and Managers can confirm production.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
