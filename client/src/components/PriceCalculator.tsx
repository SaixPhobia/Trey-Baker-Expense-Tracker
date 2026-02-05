import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RotateCcw } from "lucide-react";

export function PriceCalculator() {
  const [flourCost, setFlourCost] = useState(2.50);
  const [butterCost, setButterCost] = useState(4.00);
  const [otherCost, setOtherCost] = useState(1.50);
  const [laborHours, setLaborHours] = useState(0.5);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [margin, setMargin] = useState(60); // %

  const materialCost = flourCost + butterCost + otherCost;
  const laborCost = laborHours * hourlyRate;
  const totalCost = materialCost + laborCost;
  const recommendedPrice = totalCost / ((100 - margin) / 100);
  const profit = recommendedPrice - totalCost;

  const chartData = [
    { name: 'Materials', value: materialCost, color: 'hsl(var(--chart-2))' },
    { name: 'Labor', value: laborCost, color: 'hsl(var(--chart-5))' },
    { name: 'Profit', value: profit, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-none shadow-sm h-full">
        <CardHeader>
          <CardTitle className="font-serif">Cost Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Ingredients</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flour">Flour/Dry ($)</Label>
                <Input 
                  id="flour" type="number" step="0.10" 
                  value={flourCost} onChange={e => setFlourCost(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="butter">Butter/Fats ($)</Label>
                <Input 
                  id="butter" type="number" step="0.10" 
                  value={butterCost} onChange={e => setButterCost(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="other">Other/Misc ($)</Label>
                <Input 
                  id="other" type="number" step="0.10" 
                  value={otherCost} onChange={e => setOtherCost(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Labor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input 
                  id="hours" type="number" step="0.1" 
                  value={laborHours} onChange={e => setLaborHours(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($/hr)</Label>
                <Input 
                  id="rate" type="number" 
                  value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Target Margin</h4>
              <span className="font-mono font-bold text-primary">{margin}%</span>
            </div>
            <Slider 
              value={[margin]} 
              onValueChange={(vals) => setMargin(vals[0])} 
              max={90} step={1}
              className="py-4"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => {
            setFlourCost(2.50); setButterCost(4.00); setOtherCost(1.50);
            setLaborHours(0.5); setMargin(60);
          }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        {/* Results Card */}
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-sans uppercase tracking-widest">Recommended Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-serif font-bold mb-2">
              ${recommendedPrice.toFixed(2)}
            </div>
            <p className="text-primary-foreground/60 text-sm">
              Per unit (single batch)
            </p>
          </CardContent>
          <div className="bg-black/20 p-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase opacity-60 mb-1">Total Cost</p>
              <p className="font-mono text-lg font-bold">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-60 mb-1">Profit</p>
              <p className="font-mono text-lg font-bold text-emerald-300">+${profit.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-60 mb-1">Markup</p>
              <p className="font-mono text-lg font-bold">{((recommendedPrice/totalCost - 1)*100).toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        {/* Breakdown Chart */}
        <Card className="border-none shadow-sm flex-1 min-h-[300px]">
          <CardHeader>
            <CardTitle className="font-serif">Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs font-medium text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
