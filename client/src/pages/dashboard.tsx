import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { ExpenseTable } from "@/components/ExpenseTable";
import { DollarSign, TrendingUp, ShoppingBag, AlertCircle } from "lucide-react";
import heroImage from "@/assets/bakery-hero.png";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: 'Mon', revenue: 4000, expenses: 2400 },
  { name: 'Tue', revenue: 3000, expenses: 1398 },
  { name: 'Wed', revenue: 2000, expenses: 9800 },
  { name: 'Thu', revenue: 2780, expenses: 3908 },
  { name: 'Fri', revenue: 1890, expenses: 4800 },
  { name: 'Sat', revenue: 2390, expenses: 3800 },
  { name: 'Sun', revenue: 3490, expenses: 4300 },
];

export default function DashboardPage() {
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
          title="Total Revenue" 
          value="$12,345" 
          description="vs last week"
          trend="up"
          trendValue="+12%"
          icon={DollarSign}
        />
        <StatsCard 
          title="Total Expenses" 
          value="$4,200" 
          description="vs last week"
          trend="down"
          trendValue="-5%"
          icon={TrendingUp}
        />
        <StatsCard 
          title="Active Orders" 
          value="48" 
          description="Pending fulfillment"
          icon={ShoppingBag}
        />
        <StatsCard 
          title="Low Stock Alerts" 
          value="3" 
          description="Items need reordering"
          trend="neutral"
          icon={AlertCircle}
          className="border-l-4 border-l-destructive/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card p-6 rounded-none shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-bold text-primary">Financial Overview</h2>
            <div className="flex gap-2">
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
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* Quick Actions / Notices */}
        <div className="bg-secondary/30 p-6 border border-border">
          <h2 className="text-lg font-serif font-bold text-primary mb-4">Daily Notices</h2>
          <div className="space-y-4">
            <div className="bg-background p-4 border-l-2 border-l-primary shadow-sm">
              <h4 className="font-bold text-sm mb-1">Supplier Delivery</h4>
              <p className="text-xs text-muted-foreground">Flour shipment arriving at 2:00 PM via backdoor.</p>
            </div>
            <div className="bg-background p-4 border-l-2 border-l-accent shadow-sm">
              <h4 className="font-bold text-sm mb-1">New Menu Launch</h4>
              <p className="text-xs text-muted-foreground">Prepare display case for the new Lavender Scones.</p>
            </div>
            <div className="bg-background p-4 border-l-2 border-l-destructive shadow-sm">
              <h4 className="font-bold text-sm mb-1">Maintenance</h4>
              <p className="text-xs text-muted-foreground">Oven #3 needs calibration check.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-primary">Recent Expenses</h2>
          <button className="text-sm font-medium text-primary hover:underline underline-offset-4">View All</button>
        </div>
        <ExpenseTable />
      </div>
    </Layout>
  );
}
