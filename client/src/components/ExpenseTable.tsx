import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const expenses = [
  { id: "EXP001", date: "2024-02-04", category: "Ingredients", description: "Organic Flour (50kg)", amount: 450.00, status: "Approved" },
  { id: "EXP002", date: "2024-02-04", category: "Packaging", description: "Custom Pastry Boxes", amount: 125.50, status: "Pending" },
  { id: "EXP003", date: "2024-02-03", category: "Ingredients", description: "Premium Butter (20kg)", amount: 380.00, status: "Approved" },
  { id: "EXP004", date: "2024-02-02", category: "Utilities", description: "January Electricity", amount: 850.00, status: "Approved" },
  { id: "EXP005", date: "2024-02-01", category: "Maintenance", description: "Oven Service", amount: 200.00, status: "Pending" },
];

export function ExpenseTable() {
  return (
    <div className="border border-border rounded-none overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[100px] font-serif text-primary font-bold">ID</TableHead>
            <TableHead className="font-serif text-primary font-bold">Date</TableHead>
            <TableHead className="font-serif text-primary font-bold">Category</TableHead>
            <TableHead className="font-serif text-primary font-bold">Description</TableHead>
            <TableHead className="font-serif text-primary font-bold">Status</TableHead>
            <TableHead className="text-right font-serif text-primary font-bold">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors duration-200">
              <TableCell className="font-mono text-xs text-muted-foreground">{expense.id}</TableCell>
              <TableCell className="font-mono text-sm">{expense.date}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {expense.category}
                </span>
              </TableCell>
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(
                  "rounded-none border-none font-normal",
                  expense.status === "Approved" ? "bg-accent/20 text-accent-foreground" : "bg-orange-100 text-orange-700"
                )}>
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                ${expense.amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
