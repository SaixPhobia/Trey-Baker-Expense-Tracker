import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, CakeSlice, Package, X, ChefHat, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MenuItem, Ingredient, MenuItemIngredient } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const MENU_CATEGORIES = ["Food", "Drinks", "Seasonal Food", "Seasonal Drinks"];

function LogProductionDialog({ menuItem }: { menuItem: MenuItem }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("1");

  const { data: linkedIngredients = [] } = useQuery<MenuItemIngredient[]>({
    queryKey: [`/api/menu-items/${menuItem.id}/ingredients`],
    queryFn: async () => {
      const res = await fetch(`/api/menu-items/${menuItem.id}/ingredients`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const logMutation = useMutation({
    mutationFn: async (quantity: number) => {
      const res = await fetch(`/api/menu-items/${menuItem.id}/log-production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log production");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setOpen(false);
      setQty("1");
      toast({ title: "Production Logged", description: `Inventory updated for ${menuItem.name}.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const batchQty = Math.max(1, parseInt(qty) || 1);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQty("1"); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" data-testid={`button-log-production-${menuItem.id}`}>
          <ChefHat className="h-4 w-4 mr-1" /> Log Production
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Log Production — {menuItem.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label>How many did you make?</Label>
            <Input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="rounded-none border-muted w-32"
              data-testid="input-production-qty"
            />
          </div>
          {linkedIngredients.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ingredients to be deducted</p>
              {linkedIngredients.map((li) => {
                const ing = allIngredients.find(i => i.id === li.ingredientId);
                if (!ing) return null;
                const deduct = parseFloat(li.quantityNeeded) * batchQty;
                const remaining = Math.max(0, parseFloat(ing.quantity) - deduct);
                return (
                  <div key={li.ingredientId} className="flex items-center justify-between p-3 bg-muted/20 border border-border text-sm" data-testid={`production-deduct-${li.ingredientId}`}>
                    <span className="font-medium">{ing.name}</span>
                    <div className="text-right">
                      <span className="text-destructive font-mono">−{deduct.toFixed(2)} {ing.unit}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">→ {remaining.toFixed(2)} left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No ingredients linked to this item. Add them using the Ingredients button.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => logMutation.mutate(batchQty)}
            className="rounded-none w-full"
            disabled={linkedIngredients.length === 0 || logMutation.isPending}
            data-testid="button-confirm-production"
          >
            {logMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirm & Deduct Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IngredientsDialog({ menuItem, canManage }: { menuItem: MenuItem; canManage: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [qty, setQty] = useState("");
  const [localItems, setLocalItems] = useState<{ ingredientId: number; quantityNeeded: string; ingredientName?: string; unit?: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { data: allIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const { data: linkedIngredients = [], isLoading } = useQuery<MenuItemIngredient[]>({
    queryKey: [`/api/menu-items/${menuItem.id}/ingredients`],
    queryFn: async () => {
      const res = await fetch(`/api/menu-items/${menuItem.id}/ingredients`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (items: { ingredientId: number; quantityNeeded: string }[]) => {
      const res = await fetch(`/api/menu-items/${menuItem.id}/ingredients`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/menu-items/${menuItem.id}/ingredients`] });
      toast({ title: "Ingredients Saved", description: `Updated ingredients for ${menuItem.name}.` });
    },
  });

  useEffect(() => {
    if (!loaded && linkedIngredients.length > 0 && allIngredients.length > 0) {
      setLocalItems(linkedIngredients.map(li => {
        const ing = allIngredients.find(i => i.id === li.ingredientId);
        return {
          ingredientId: li.ingredientId,
          quantityNeeded: li.quantityNeeded,
          ingredientName: ing?.name,
          unit: ing?.unit,
        };
      }));
      setLoaded(true);
    }
  }, [loaded, linkedIngredients, allIngredients]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setLoaded(false);
      setLocalItems([]);
      setSelectedIngredient("");
      setQty("");
    }
  };

  const addIngredient = () => {
    if (!selectedIngredient || !qty) return;
    const ingId = parseInt(selectedIngredient);
    if (localItems.some(i => i.ingredientId === ingId)) {
      toast({ title: "Already Added", description: "This ingredient is already in the list.", variant: "destructive" });
      return;
    }
    const ing = allIngredients.find(i => i.id === ingId);
    setLocalItems([...localItems, { ingredientId: ingId, quantityNeeded: qty, ingredientName: ing?.name, unit: ing?.unit }]);
    setSelectedIngredient("");
    setQty("");
  };

  const removeIngredient = (ingredientId: number) => {
    setLocalItems(localItems.filter(i => i.ingredientId !== ingredientId));
  };

  const handleSave = () => {
    saveMutation.mutate(localItems.map(i => ({ ingredientId: i.ingredientId, quantityNeeded: i.quantityNeeded })));
  };

  const ingredientCost = localItems.reduce((sum, li) => {
    const ing = allIngredients.find(i => i.id === li.ingredientId);
    if (!ing) return sum;
    return sum + parseFloat(li.quantityNeeded) * parseFloat(ing.costPerUnit);
  }, 0);

  const availableIngredients = allIngredients.filter(i => !localItems.some(li => li.ingredientId === i.id));

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" data-testid={`button-ingredients-${menuItem.id}`}>
          <Package className="h-4 w-4 mr-1" /> Ingredients
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Ingredients for {menuItem.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {localItems.length > 0 && (
              <div className="space-y-2">
                {localItems.map((item) => {
                  const ing = allIngredients.find(i => i.id === item.ingredientId);
                  const cost = ing ? parseFloat(item.quantityNeeded) * parseFloat(ing.costPerUnit) : 0;
                  return (
                    <div key={item.ingredientId} className="flex items-center justify-between p-3 bg-muted/30 border border-border" data-testid={`ingredient-row-${item.ingredientId}`}>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{item.ingredientName || `Ingredient #${item.ingredientId}`}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {item.quantityNeeded} {item.unit || ""}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-primary mr-3">${cost.toFixed(2)}</span>
                      {canManage && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeIngredient(item.ingredientId)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm font-medium">Ingredient Cost</span>
                  <span className="font-mono text-sm font-bold text-primary">${ingredientCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sale Price</span>
                  <span className="font-mono text-sm">${parseFloat(menuItem.basePrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Margin</span>
                  <span className={`font-mono text-sm font-bold ${parseFloat(menuItem.basePrice) - ingredientCost > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    ${(parseFloat(menuItem.basePrice) - ingredientCost).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            {localItems.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No ingredients linked yet.</p>
            )}

            {canManage && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Ingredient</Label>
                  <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                    <SelectTrigger className="rounded-none border-muted text-sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {availableIngredients.map(ing => (
                        <SelectItem key={ing.id} value={String(ing.id)}>{ing.name} ({ing.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0.00"
                    className="rounded-none border-muted text-sm"
                    data-testid="input-ingredient-qty"
                  />
                </div>
                <Button size="sm" className="rounded-none" onClick={addIngredient} data-testid="button-add-ingredient-to-item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        {canManage && (
          <DialogFooter>
            <Button onClick={handleSave} className="rounded-none w-full" disabled={saveMutation.isPending} data-testid="button-save-ingredients">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Ingredients
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MenuItemsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "Owner" || user?.role === "Manager";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", basePrice: "", category: "Food" });

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setIsDialogOpen(false);
      setNewItem({ name: "", description: "", basePrice: "", category: "Food" });
      toast({ title: "Menu Item Added", description: "Successfully added new menu item." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({ title: "Menu Item Deleted", description: "Menu item has been removed.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item.name, description: item.description, basePrice: item.basePrice, category: item.category }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setEditOpen(false);
      setEditItem(null);
      toast({ title: "Menu Item Updated", description: "Changes saved successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" }),
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.basePrice) return;
    createMutation.mutate(newItem);
  };

  const itemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Menu Items</h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage your bakery's menu with prices. Click "Ingredients" on any item to link ingredients and see cost margins.
            </p>
          </div>
          {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none" data-testid="button-new-menu-item">
                <Plus className="h-4 w-4" /> New Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif">Add New Menu Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="input-menu-item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. Sourdough Loaf"
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    data-testid="input-menu-item-description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Artisan sourdough with a crispy crust..."
                    className="rounded-none border-muted resize-none h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="basePrice">Base Price ($)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      data-testid="input-menu-item-price"
                      value={newItem.basePrice}
                      onChange={(e) => setNewItem({ ...newItem, basePrice: e.target.value })}
                      placeholder="0.00"
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger className="rounded-none border-muted">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {MENU_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem} className="rounded-none w-full" disabled={createMutation.isPending} data-testid="button-submit-menu-item">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Menu Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed border-border bg-muted/10">
            <CakeSlice className="h-10 w-10 mb-3 opacity-50" />
            <p>No menu items yet. Click "New Menu Item" to add your first product.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-serif font-bold text-primary mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <Card key={item.id} className="border-none shadow-sm rounded-none" data-testid={`card-menu-item-${item.id}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg flex items-center justify-between">
                          {item.name}
                          <span className="font-mono text-primary text-xl">${parseFloat(item.basePrice).toFixed(2)}</span>
                        </CardTitle>
                      </CardHeader>
                      {item.description && (
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </CardContent>
                      )}
                      <CardFooter className="pt-2 flex flex-wrap gap-1 justify-between">
                        <IngredientsDialog menuItem={item} canManage={canManage} />
                        <LogProductionDialog menuItem={item} />
                        {canManage && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditItem({ ...item }); setEditOpen(true); }}
                              data-testid={`button-edit-menu-item-${item.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(item.id)}
                              data-testid={`button-delete-menu-item-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editItem && (
        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditItem(null); }}>
          <DialogContent className="rounded-none sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif">Edit Menu Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  data-testid="input-edit-menu-item-name"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="rounded-none border-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  data-testid="input-edit-menu-item-description"
                  value={editItem.description ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="rounded-none border-muted resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Base Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    data-testid="input-edit-menu-item-price"
                    value={editItem.basePrice}
                    onChange={(e) => setEditItem({ ...editItem, basePrice: e.target.value })}
                    className="rounded-none border-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={editItem.category}
                    onValueChange={(value) => setEditItem({ ...editItem, category: value })}
                  >
                    <SelectTrigger className="rounded-none border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {MENU_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => updateMutation.mutate(editItem)}
                className="rounded-none w-full"
                disabled={updateMutation.isPending || !editItem.name || !editItem.basePrice}
                data-testid="button-save-menu-item-edit"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
