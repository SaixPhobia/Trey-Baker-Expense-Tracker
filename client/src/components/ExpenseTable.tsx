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
import { MoreHorizontal, Trash2, CheckCircle2, Clock, Plus, Loader2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, Ingredient } from "@shared/schema";

const EXPENSE_CATEGORIES = ["Ingredients", "Packaging", "Utilities", "Maintenance", "Marketing", "Labor", "Equipment"];

export function ExpenseTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    quantity: "1",
    category: "Ingredients",
    reimbursement: "No",
    submittedBy: ""
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses");
      return res.json();
    }
  });

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (expense: { description: string; amount: string; quantity: string; category: string; reimbursement: string; submittedBy: string }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expense, status: "Pending" })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsDialogOpen(false);
      setNewExpense({ description: "", amount: "", quantity: "1", category: "Ingredients", reimbursement: "No", submittedBy: "" });
      toast({ title: "Expense Added", description: "Successfully added new expense entry." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; reimbursement?: string }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense Updated", description: "Expense has been updated." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense Deleted", description: "Expense has been removed.", variant: "destructive" });
    }
  });

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    createMutation.mutate(newExpense);
  };

  const handleSelectIngredient = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id.toString() === ingredientId);
    if (ingredient) {
      setNewExpense({
        ...newExpense,
        description: `${ingredient.name} (${ingredient.unit})`,
        amount: ingredient.costPerUnit,
        category: "Ingredients"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none" data-testid="button-new-expense">
              <Plus className="h-4 w-4" /> New Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif">Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="submittedBy">Your Name</Label>
                <Input
                  id="submittedBy"
                  data-testid="input-expense-submitted-by"
                  value={newExpense.submittedBy}
                  onChange={(e) => setNewExpense({ ...newExpense, submittedBy: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="rounded-none border-muted"
                />
              </div>
              {ingredients.length > 0 && (
                <div className="grid gap-2">
                  <Label>Quick Add from Ingredients</Label>
                  <Select onValueChange={handleSelectIngredient}>
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue placeholder="Select an ingredient..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.name} - ${ing.costPerUnit}/{ing.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  data-testid="input-expense-description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="e.g. Organic Flour"
                  className="rounded-none border-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    data-testid="input-expense-quantity"
                    value={newExpense.quantity}
                    onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                    placeholder="1"
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Unit Cost ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    data-testid="input-expense-amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="rounded-none border-muted"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Reimbursement</Label>
                  <Select
                    value={newExpense.reimbursement}
                    onValueChange={(value) => setNewExpense({ ...newExpense, reimbursement: value })}
                  >
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue placeholder="Reimbursement?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Requested">Requested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense} className="rounded-none w-full" disabled={createMutation.isPending} data-testid="button-submit-expense">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-none overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[80px] font-serif text-primary font-bold">ID</TableHead>
              <TableHead className="font-serif text-primary font-bold">Date</TableHead>
              <TableHead className="font-serif text-primary font-bold">Submitted By</TableHead>
              <TableHead className="font-serif text-primary font-bold">Category</TableHead>
              <TableHead className="font-serif text-primary font-bold">Description</TableHead>
              <TableHead className="font-serif text-primary font-bold">Status</TableHead>
              <TableHead className="font-serif text-primary font-bold">Reimbursement</TableHead>
              <TableHead className="text-right font-serif text-primary font-bold">Qty</TableHead>
              <TableHead className="text-right font-serif text-primary font-bold">Unit Cost</TableHead>
              <TableHead className="text-right font-serif text-primary font-bold">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No expenses yet. Click "New Expense" to add your first entry.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors duration-200" data-testid={`row-expense-${expense.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{expense.id}</TableCell>
                  <TableCell className="font-mono text-sm">{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-sm">{expense.submittedBy || <span className="text-muted-foreground italic">—</span>}</TableCell>
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
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "rounded-none border-none font-normal px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      expense.reimbursement === "Reimbursed" ? "bg-blue-50 text-blue-700" :
                      expense.reimbursement === "Requested" ? "bg-violet-50 text-violet-700" :
                      "bg-gray-50 text-gray-500"
                    )}>
                      {expense.reimbursement === "Reimbursed" ? <CheckCircle2 className="mr-1 h-3 w-3 inline" /> :
                       expense.reimbursement === "Requested" ? <RefreshCw className="mr-1 h-3 w-3 inline" /> : null}
                      {expense.reimbursement}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {parseFloat(expense.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ${(parseFloat(expense.quantity) * parseFloat(expense.amount)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded-none transition-colors" data-testid={`button-expense-actions-${expense.id}`}>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none">
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: expense.id, status: expense.status === "Approved" ? "Pending" : "Approved" })}>
                          Mark as {expense.status === "Approved" ? "Pending" : "Approved"}
                        </DropdownMenuItem>
                        {expense.reimbursement === "No" && (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: expense.id, reimbursement: "Requested" })}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Request Reimbursement
                          </DropdownMenuItem>
                        )}
                        {expense.reimbursement === "Requested" && (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: expense.id, reimbursement: "Reimbursed" })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Reimbursed
                          </DropdownMenuItem>
                        )}
                        {expense.reimbursement === "Reimbursed" && (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: expense.id, reimbursement: "No" })}>
                            Clear Reimbursement
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(expense.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
