import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingBag, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

type ReportData = {
  summary: {
    totalRevenue: number;
    totalIngredientCost: number;
    totalExpenses: number;
    netProfit: number;
  };
  receiptRows: {
    id: number;
    date: string;
    createdBy: string;
    total: string;
    commission: string;
  }[];
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border p-5 bg-background">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (user && user.role === "Staff") {
    navigate("/");
    return null;
  }

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  const summary = data?.summary;
  const receipts = data?.receiptRows ?? [];

  const totalCommission = receipts.reduce((s, r) => s + parseFloat(r.commission), 0);

  const byStaff: Record<string, { revenue: number; commission: number; count: number }> = {};
  for (const r of receipts) {
    if (!byStaff[r.createdBy]) byStaff[r.createdBy] = { revenue: 0, commission: 0, count: 0 };
    byStaff[r.createdBy].revenue += parseFloat(r.total);
    byStaff[r.createdBy].commission += parseFloat(r.commission);
    byStaff[r.createdBy].count += 1;
  }
  const staffRows = Object.entries(byStaff).sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold tracking-tight mb-1">Reports</h1>
        <p className="text-muted-foreground text-sm">Profit & loss summary and 40% commission breakdown per sale.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Revenue"
              value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
              sub="All completed receipts"
              color="text-emerald-600"
            />
            <StatCard
              label="Ingredient Cost"
              value={`$${(summary?.totalIngredientCost ?? 0).toFixed(2)}`}
              sub="From production logs"
              color="text-destructive"
            />
            <StatCard
              label="Expenses"
              value={`$${(summary?.totalExpenses ?? 0).toFixed(2)}`}
              sub="Logged expenses"
              color="text-destructive"
            />
            <StatCard
              label="Net Profit"
              value={`$${(summary?.netProfit ?? 0).toFixed(2)}`}
              sub="Revenue − costs − expenses"
              color={(summary?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"}
            />
          </div>

          <Tabs defaultValue="sales">
            <TabsList className="rounded-none mb-6 h-auto p-0 bg-transparent border-b border-border w-full justify-start gap-0">
              <TabsTrigger
                value="sales"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-2.5 text-sm"
                data-testid="tab-sales"
              >
                Sales & Commission
                <Badge variant="secondary" className="ml-2 rounded-none text-xs px-1.5 py-0">{receipts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-2.5 text-sm"
                data-testid="tab-staff"
              >
                By Staff Member
              </TabsTrigger>
            </TabsList>

            {/* ── SALES TAB ── */}
            <TabsContent value="sales">
              <div className="border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">All Sales</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">40% commission per sale</p>
                </div>

                {receipts.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground text-sm">No receipts yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-5 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                      <span className="col-span-2">Date & Staff</span>
                      <span className="text-center">Receipt #</span>
                      <span className="text-right">Sale Total</span>
                      <span className="text-right">40% Commission</span>
                    </div>

                    {receipts.map(r => (
                      <div key={r.id} className="grid grid-cols-5 px-6 py-3 items-center" data-testid={`report-row-${r.id}`}>
                        <div className="col-span-2">
                          <p className="text-sm font-medium">{r.createdBy}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <span className="text-center font-mono text-sm text-muted-foreground">#{r.id}</span>
                        <span className="text-right font-mono text-sm font-semibold">${parseFloat(r.total).toFixed(2)}</span>
                        <span className="text-right font-mono text-sm font-bold text-primary">${parseFloat(r.commission).toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="grid grid-cols-5 px-6 py-3 items-center bg-muted/20 border-t-2 border-border">
                      <div className="col-span-2">
                        <p className="text-sm font-bold">Total</p>
                      </div>
                      <span className="text-center font-mono text-sm font-bold">{receipts.length} sales</span>
                      <span className="text-right font-mono text-sm font-bold text-emerald-600">${(summary?.totalRevenue ?? 0).toFixed(2)}</span>
                      <span className="text-right font-mono text-sm font-bold text-primary">${totalCommission.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── BY STAFF TAB ── */}
            <TabsContent value="staff">
              <div className="border border-border">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Commission by Staff Member</h2>
                </div>

                {staffRows.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground text-sm">No data yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-4 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                      <span className="col-span-2">Staff Member</span>
                      <span className="text-center">Sales</span>
                      <span className="text-right">Total Revenue</span>
                    </div>

                    {staffRows.map(([name, stats]) => (
                      <div key={name} className="grid grid-cols-4 px-6 py-4 items-center" data-testid={`staff-row-${name}`}>
                        <div className="col-span-2">
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs font-mono text-primary font-semibold">
                            ${stats.commission.toFixed(2)} commission
                          </p>
                        </div>
                        <span className="text-center font-mono text-sm text-muted-foreground">{stats.count}</span>
                        <span className="text-right font-mono text-sm font-bold text-emerald-600">${stats.revenue.toFixed(2)}</span>
                      </div>
                    ))}

                    <div className="grid grid-cols-4 px-6 py-3 items-center bg-muted/20 border-t-2 border-border">
                      <div className="col-span-2">
                        <p className="text-sm font-bold">Total</p>
                        <p className="text-xs font-mono font-bold text-primary">${totalCommission.toFixed(2)} commission</p>
                      </div>
                      <span className="text-center font-mono text-sm font-bold">{receipts.length}</span>
                      <span className="text-right font-mono text-sm font-bold text-emerald-600">${(summary?.totalRevenue ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </Layout>
  );
}
