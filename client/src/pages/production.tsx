import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ChefHat, AlertTriangle, CheckCircle2, RotateCcw, History, PackageCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MenuItem, Ingredient, MenuItemIngredient, ProductionLog } from "@shared/schema";
import { useAuth } from "@/lib/auth";

export default function ProductionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "Owner" || user?.role === "Manager";

  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [historySearch, setHistorySearch] = useState("");

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

  const { data: productionLogs = [] } = useQuery<ProductionLog[]>({
    queryKey: ["/api/production/logs"],
    queryFn: async () => {
      const res = await fetch("/api/production/logs");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  type StockItem = { menuItemId: number; menuItemName: string; basePrice: string; produced: number; sold: number; inStock: number };
  const { data: stockItems = [], isLoading: stockLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
    queryFn: async () => {
      const res = await fetch("/api/stock");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (items: { menuItemId: number; quantity: number; menuItemName: string }[]) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/production/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setQuantities({});
      toast({ title: "Production Logged", description: "Ingredient inventory has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const activeItems = useMemo(() =>
    menuItems.filter(item => parseInt(quantities[item.id] || "0") > 0),
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
    batchMutation.mutate(activeItems.map(item => ({
      menuItemId: item.id,
      quantity: parseInt(quantities[item.id]),
      menuItemName: item.name,
    })));
  };

  const groupedHistory = useMemo(() => {
    const filtered = [...productionLogs]
      .filter(l => !historySearch || l.menuItemName.toLowerCase().includes(historySearch.toLowerCase()))
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

    const byDate: Record<string, ProductionLog[]> = {};
    for (const log of filtered) {
      const dateKey = new Date(log.loggedAt).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(log);
    }
    return Object.entries(byDate);
  }, [productionLogs, historySearch]);

  const CATEGORIES = ["Food", "Drinks", "Seasonal Food", "Seasonal Drinks"];
  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: menuItems.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);
  const uncategorised = menuItems.filter(i => !CATEGORIES.includes(i.category ?? ""));
  if (uncategorised.length > 0) grouped.push({ cat: "Other", items: uncategorised });

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1">Production</h1>
          <p className="text-muted-foreground text-sm">Plan batches, track stock, and review history.</p>
        </div>
      </div>

      <Tabs defaultValue="planner">
        <TabsList className="rounded-none mb-6 h-auto p-0 bg-transparent border-b border-border w-full justify-start gap-0">
          <TabsTrigger
            value="planner"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-2.5 text-sm"
            data-testid="tab-planner"
          >
            Planner {hasAnyQty && <Badge variant="secondary" className="ml-2 rounded-none text-xs px-1.5 py-0">{activeItems.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-2.5 text-sm"
            data-testid="tab-stock"
          >
            Current Stock {stockItems.length > 0 && <Badge variant="secondary" className="ml-2 rounded-none text-xs px-1.5 py-0">{stockItems.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-2.5 text-sm"
            data-testid="tab-history"
          >
            History {productionLogs.length > 0 && <Badge variant="secondary" className="ml-2 rounded-none text-xs px-1.5 py-0">{productionLogs.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── PLANNER TAB ── */}
        <TabsContent value="planner">
          <div className="flex justify-end mb-4">
            {hasAnyQty && (
              <Button variant="outline" size="sm" onClick={() => setQuantities({})} className="rounded-none" data-testid="button-reset-plan">
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
              {/* Left: quantities */}
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
                              {!hasLinks && <p className="text-xs text-muted-foreground">No ingredients linked</p>}
                            </div>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={qty}
                              onChange={e => setQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
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

              {/* Right: ingredient preview */}
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
                            <p className="text-sm font-mono font-semibold text-destructive">−{needed.toFixed(2)} {ing.unit}</p>
                            <p className={`text-xs font-mono ${sufficient ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                              → {remaining.toFixed(2)} left
                            </p>
                          </div>
                          <div className="shrink-0">
                            {sufficient
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : <AlertTriangle className="h-4 w-4 text-destructive" />}
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

                    {canManage ? (
                      <Button
                        onClick={handleConfirm}
                        className="rounded-none w-full"
                        disabled={batchMutation.isPending}
                        data-testid="button-confirm-batch"
                      >
                        {batchMutation.isPending
                          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Logging...</>
                          : <><ChefHat className="h-4 w-4 mr-2" /> Log Production & Deduct Inventory</>}
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">Only Owners and Managers can confirm production.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── STOCK TAB ── */}
        <TabsContent value="stock">
          <div className="border border-border overflow-x-auto" data-testid="current-stock">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Current Stock</h2>
              </div>
              <p className="text-xs text-muted-foreground">Produced minus sold via receipts</p>
            </div>

            {stockLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : stockItems.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No production logged yet. Use the Planner tab to log your first batch.</div>
            ) : (
              <div className="divide-y divide-border">
                <div className="grid grid-cols-5 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Produced</span>
                  <span className="text-center">Sold</span>
                  <span className="text-right">In Stock</span>
                </div>

                {stockItems.map(item => {
                  const stockValue = item.inStock * parseFloat(item.basePrice);
                  const low = item.inStock === 0;
                  return (
                    <div key={item.menuItemId} className={`grid grid-cols-5 px-6 py-3 items-center ${low ? "bg-destructive/5" : ""}`} data-testid={`stock-item-${item.menuItemId}`}>
                      <div className="col-span-2">
                        <p className="text-sm font-medium">{item.menuItemName}</p>
                        <p className="text-xs text-muted-foreground font-mono">${stockValue.toFixed(2)} value</p>
                      </div>
                      <span className="text-center font-mono text-sm text-muted-foreground">{item.produced}</span>
                      <span className="text-center font-mono text-sm text-muted-foreground">{item.sold}</span>
                      <div className="text-right">
                        <span className={`font-mono text-sm font-bold ${low ? "text-destructive" : "text-emerald-600"}`}>{item.inStock} pcs</span>
                        {low && <p className="text-[10px] text-destructive uppercase tracking-wider">Out of stock</p>}
                      </div>
                    </div>
                  );
                })}

                {(() => {
                  const totalInStock = stockItems.reduce((s, i) => s + i.inStock, 0);
                  const totalValue = stockItems.reduce((s, i) => s + i.inStock * parseFloat(i.basePrice), 0);
                  const totalProduced = stockItems.reduce((s, i) => s + i.produced, 0);
                  const totalSold = stockItems.reduce((s, i) => s + i.sold, 0);
                  return (
                    <div className="grid grid-cols-5 px-6 py-3 items-center bg-muted/20 border-t-2 border-border">
                      <div className="col-span-2">
                        <p className="text-sm font-bold">Total</p>
                        <p className="text-xs font-mono font-bold text-emerald-600">${totalValue.toFixed(2)} value</p>
                      </div>
                      <span className="text-center font-mono text-sm font-bold">{totalProduced}</span>
                      <span className="text-center font-mono text-sm font-bold">{totalSold}</span>
                      <span className="text-right font-mono text-sm font-bold text-emerald-600">{totalInStock} pcs</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history">
          <div className="border border-border overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Production History</h2>
                {productionLogs.length > 0 && (
                  <span className="text-xs text-muted-foreground">({productionLogs.length} entries)</span>
                )}
              </div>
              {productionLogs.length > 0 && (
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Filter by item…"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    className="rounded-none border-muted h-8 text-sm pl-8"
                    data-testid="input-history-search"
                  />
                </div>
              )}
            </div>

            {productionLogs.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No production logged yet.</div>
            ) : groupedHistory.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No results match "{historySearch}".</div>
            ) : (
              <div>
                {groupedHistory.map(([dateLabel, logs]) => {
                  const dayTotal = logs.reduce((s, l) => s + l.quantity, 0);
                  const daySales = logs.reduce((s, l) => s + parseFloat(l.saleAmount), 0);
                  return (
                    <div key={dateLabel}>
                      <div className="flex items-center justify-between px-6 py-2 bg-muted/20 border-b border-border sticky top-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dateLabel}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {dayTotal} pcs · <span className="text-emerald-600">${daySales.toFixed(2)}</span>
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {logs.map(log => (
                          <div key={log.id} className="flex items-center justify-between px-6 py-3" data-testid={`history-row-${log.id}`}>
                            <div>
                              <p className="text-sm font-medium">{log.menuItemName}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.loggedBy} · {new Date(log.loggedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div className="text-xs space-y-0.5">
                                <p className="text-emerald-600 font-mono font-medium" data-testid={`history-sale-${log.id}`}>${parseFloat(log.saleAmount).toFixed(2)} sales</p>
                                <p className="text-muted-foreground font-mono" data-testid={`history-cost-${log.id}`}>${parseFloat(log.ingredientCost).toFixed(2)} cost</p>
                              </div>
                              <Badge variant="secondary" className="rounded-none font-mono shrink-0">{log.quantity} pcs</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
