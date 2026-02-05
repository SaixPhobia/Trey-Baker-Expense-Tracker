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
import { MoreHorizontal, Trash2, CheckCircle2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const initialExpenses = [
  { id: "EXP001", date: "2024-02-04", category: "Ingredients", description: "Organic Flour (50kg)", amount: 450.00, status: "Approved" },
  { id: "EXP002", date: "2024-02-04", category: "Packaging", description: "Custom Pastry Boxes", amount: 125.50, status: "Pending" },
  { id: "EXP003", date: "2024-02-03", category: "Ingredients", description: "Premium Butter (20kg)", amount: 380.00, status: "Approved" },
  { id: "EXP004", date: "2024-02-02", category: "Utilities", description: "January Electricity", amount: 850.00, status: "Approved" },
  { id: "EXP005", date: "2024-02-01", category: "Maintenance", description: "Oven Service", amount: 200.00, status: "Pending" },
];

export function ExpenseTable() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const { toast } = useToast();

  const handleStatusChange = (id: string, newStatus: string) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: newStatus } : exp));
    toast({
      title: "Status Updated",
      description: `Expense ${id} is now ${newStatus}.`,
    });
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    toast({
      title: "Expense Deleted",
      description: `Expense ${id} has been removed.`,
      variant: "destructive",
    });
  };

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
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors duration-200">
              <TableCell className="font-mono text-xs text-muted-foreground">{expense.id}</TableCell>
              <TableCell className="font-mono text-sm">{expense.date}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-primary">
                  {expense.category}
                </span>
              </TableCell>
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(
                  "rounded-none border-none font-normal px-2 py-0.5 text-[10px] uppercase tracking-wider",
                  expense.status === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {expense.status === "Approved" ? <CheckCircle2 className="mr-1 h-3 w-3 inline" /> : <Clock className="mr-1 h-3 w-3 inline" />}
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                ${expense.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-muted rounded-none transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    <DropdownMenuItem onClick={() => handleStatusChange(expense.id, expense.status === "Approved" ? "Pending" : "Approved")}>
                      Mark as {expense.status === "Approved" ? "Pending" : "Approved"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
