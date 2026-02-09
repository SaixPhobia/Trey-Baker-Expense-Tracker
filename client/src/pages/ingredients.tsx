import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Package, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Ingredient } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const INGREDIENT_CATEGORIES = ["Flour", "Dairy", "Eggs", "Sugar", "Fats", "Fruits", "Nuts", "Chocolate", "Spices", "Other"];
const UNITS = ["kg", "g", "L", "ml", "dozen", "unit", "lb", "oz"];

export default function IngredientsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "Owner" || user?.role === "Manager";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", unit: "kg", costPerUnit: "", category: "Flour" });
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    costPerUnit: "",
    category: "Flour"
  });

  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (ingredient: typeof newIngredient) => {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ingredient)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setIsDialogOpen(false);
      setNewIngredient({ name: "", quantity: "", unit: "kg", costPerUnit: "", category: "Flour" });
      toast({ title: "Ingredient Added", description: "Successfully added new ingredient." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name: string; quantity: string; unit: string; costPerUnit: string; category: string }) => {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update ingredient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setEditingIngredient(null);
      toast({ title: "Ingredient Updated", description: "Changes have been saved." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient Deleted", description: "Ingredient has been removed.", variant: "destructive" });
    }
  });

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditForm({
      name: ingredient.name,
      quantity: parseFloat(ingredient.quantity).toString(),
      unit: ingredient.unit,
      costPerUnit: parseFloat(ingredient.costPerUnit).toString(),
      category: ingredient.category,
    });
    setEditingIngredient(ingredient);
  };

  const handleSaveEdit = () => {
    if (!editingIngredient || !editForm.name || !editForm.quantity || !editForm.costPerUnit) return;
    updateMutation.mutate({ id: editingIngredient.id, ...editForm });
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.costPerUnit || !newIngredient.quantity) return;
    createMutation.mutate(newIngredient);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Ingredients</h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage your ingredient inventory and costs. These will appear as quick-select options when adding expenses.
            </p>
          </div>
          {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none" data-testid="button-new-ingredient">
                <Plus className="h-4 w-4" /> New Ingredient
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif">Add New Ingredient</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="input-ingredient-name"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    placeholder="e.g. Organic Flour"
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      data-testid="input-ingredient-quantity"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                      placeholder="0"
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="costPerUnit">Cost per Unit ($)</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      data-testid="input-ingredient-cost"
                      value={newIngredient.costPerUnit}
                      onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: e.target.value })}
                      placeholder="0.00"
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                    >
                      <SelectTrigger className="rounded-none border-muted">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={newIngredient.category}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, category: value })}
                  >
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {INGREDIENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddIngredient} className="rounded-none w-full" disabled={createMutation.isPending} data-testid="button-submit-ingredient">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Ingredient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border rounded-none overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-serif text-primary font-bold">Name</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Category</TableHead>
                  <TableHead className="text-right font-serif text-primary font-bold">Quantity</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Unit</TableHead>
                  <TableHead className="text-right font-serif text-primary font-bold">Cost per Unit</TableHead>
                  <TableHead className="text-right font-serif text-primary font-bold">Total Cost</TableHead>
                  {canManage && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No ingredients yet. Click "New Ingredient" to add your first one.
                    </TableCell>
                  </TableRow>
                ) : (
                  ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-ingredient-${ingredient.id}`}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-primary">
                          {ingredient.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{parseFloat(ingredient.quantity).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{ingredient.unit}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${parseFloat(ingredient.costPerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${(parseFloat(ingredient.quantity) * parseFloat(ingredient.costPerUnit)).toFixed(2)}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => handleEditIngredient(ingredient)}
                              data-testid={`button-edit-ingredient-${ingredient.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(ingredient.id)}
                              data-testid={`button-delete-ingredient-${ingredient.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!editingIngredient} onOpenChange={(open) => { if (!open) setEditingIngredient(null); }}>
          <DialogContent className="rounded-none sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif">Edit Ingredient</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  data-testid="input-edit-ingredient-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="rounded-none border-muted"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="0.01"
                    data-testid="input-edit-ingredient-quantity"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-costPerUnit">Cost per Unit ($)</Label>
                  <Input
                    id="edit-costPerUnit"
                    type="number"
                    step="0.01"
                    data-testid="input-edit-ingredient-cost"
                    value={editForm.costPerUnit}
                    onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Select
                    value={editForm.unit}
                    onValueChange={(value) => setEditForm({ ...editForm, unit: value })}
                  >
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger className="rounded-none border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {INGREDIENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/30 border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Cost Preview</p>
                <p className="text-lg font-mono font-bold text-primary" data-testid="text-edit-total-cost">
                  ${((parseFloat(editForm.quantity) || 0) * (parseFloat(editForm.costPerUnit) || 0)).toFixed(2)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEdit} className="rounded-none w-full" disabled={updateMutation.isPending} data-testid="button-save-ingredient">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
