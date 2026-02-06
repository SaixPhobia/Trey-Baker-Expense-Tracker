import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { DollarSign, TrendingUp, Package, CakeSlice, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Expense, Ingredient, MenuItem } from "@shared/schema";

const chartData = [
  { name: 'Mon', revenue: 4000, expenses: 2400 },
  { name: 'Tue', revenue: 3000, expenses: 1398 },
  { name: 'Wed', revenue: 2000, expenses: 800 },
  { name: 'Thu', revenue: 2780, expenses: 1908 },
  { name: 'Fri', revenue: 1890, expenses: 800 },
  { name: 'Sat', revenue: 2390, expenses: 1800 },
  { name: 'Sun', revenue: 3490, expenses: 1300 },
];

export default function DashboardPage() {
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses");
      return res.json();
    }
  });

  const { data: ingredients = [], isLoading: ingredientsLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      return res.json();
    }
  });

  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      return res.json();
    }
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.quantity) * parseFloat(exp.amount)), 0);
  const pendingExpenses = expenses.filter(exp => exp.status === "Pending").length;
  const isLoading = expensesLoading || ingredientsLoading || menuItemsLoading;

  return (
    <Layout>
      <div className="relative h-32 w-full overflow-hidden mb-8 border border-border bg-muted/20">
        <div className="absolute inset-0 flex flex-col justify-center px-8 z-20">
          <h1 className="text-2xl font-serif font-bold tracking-tight">Welcome, Trey</h1>
          <p className="text-sm text-muted-foreground">Operational overview for today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Expenses" 
          value={isLoading ? "..." : `$${totalExpenses.toFixed(2)}`}
          description={`${expenses.length} entries`}
          icon={DollarSign}
        />
        <StatsCard 
          title="Pending Approval" 
          value={isLoading ? "..." : pendingExpenses.toString()}
          description="Expenses awaiting review"
          trend={pendingExpenses > 0 ? "neutral" : undefined}
          icon={TrendingUp}
        />
        <StatsCard 
          title="Ingredients" 
          value={isLoading ? "..." : ingredients.length.toString()}
          description="In your inventory"
          icon={Package}
        />
        <StatsCard 
          title="Menu Items" 
          value={isLoading ? "..." : menuItems.length.toString()}
          description="Products listed"
          icon={CakeSlice}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card p-6 rounded-none shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-bold text-primary">Financial Overview</h2>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-chart-1"></div> Revenue
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-chart-2"></div> Expenses
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  fillOpacity={0.1} 
                  fill="hsl(var(--chart-2))" 
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-secondary/30 p-6 border border-border">
          <h2 className="text-lg font-serif font-bold text-primary mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/expenses" className="block bg-background p-4 border-l-2 border-l-primary shadow-sm hover:bg-muted/20 transition-colors">
              <h4 className="font-bold text-sm mb-1">Manage Expenses</h4>
              <p className="text-xs text-muted-foreground">Add, approve, or export expense reports.</p>
            </Link>
            <Link href="/ingredients" className="block bg-background p-4 border-l-2 border-l-accent shadow-sm hover:bg-muted/20 transition-colors">
              <h4 className="font-bold text-sm mb-1">Ingredient Inventory</h4>
              <p className="text-xs text-muted-foreground">Track ingredient costs and stock levels.</p>
            </Link>
            <Link href="/menu-items" className="block bg-background p-4 border-l-2 border-l-primary shadow-sm hover:bg-muted/20 transition-colors">
              <h4 className="font-bold text-sm mb-1">Menu Management</h4>
              <p className="text-xs text-muted-foreground">Add or update bakery products and prices.</p>
            </Link>
            <Link href="/pricing" className="block bg-background p-4 border-l-2 border-l-accent shadow-sm hover:bg-muted/20 transition-colors">
              <h4 className="font-bold text-sm mb-1">Price Calculator</h4>
              <p className="text-xs text-muted-foreground">Calculate optimal product pricing.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-primary">Recent Expenses</h2>
          <Link href="/expenses" className="text-sm font-medium text-primary hover:underline underline-offset-4">
            View All
          </Link>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No expenses recorded yet. Head to <Link href="/expenses" className="text-primary underline">Expenses</Link> to add your first entry.
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 5).map(expense => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium">${parseFloat(expense.amount).toFixed(2)}</p>
                  <p className={`text-[10px] uppercase ${expense.status === "Approved" ? "text-emerald-600" : "text-amber-600"}`}>
                    {expense.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
