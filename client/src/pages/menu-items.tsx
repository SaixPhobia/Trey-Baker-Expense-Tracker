import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, CakeSlice } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { MenuItem } from "@shared/schema";

const MENU_CATEGORIES = ["Food", "Drinks", "Seasonal Food", "Seasonal Drinks"];

export default function MenuItemsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "Food"
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
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

  const handleAddItem = () => {
    if (!newItem.name || !newItem.basePrice) return;
    createMutation.mutate(newItem);
  };

  // Group items by category
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
              Manage your bakery's menu with prices. Use the Price Calculator to determine optimal pricing based on ingredient costs.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
          </Dialog>
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
                      <CardFooter className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive ml-auto"
                          onClick={() => deleteMutation.mutate(item.id)}
                          data-testid={`button-delete-menu-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
