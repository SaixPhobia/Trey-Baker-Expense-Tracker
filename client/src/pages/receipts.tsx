import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, ReceiptText, Minus, Printer, Eye, X, Search, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MenuItem, Receipt, ReceiptItem } from "@shared/schema";
import { useAuth } from "@/lib/auth";

interface CartItem {
  menuItemId: number | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function ReceiptViewDialog({ receipt, onClose }: { receipt: (Receipt & { items?: ReceiptItem[] }) | null; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${receipt.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 16px; }
            .header h1 { font-size: 18px; margin: 0; }
            .header p { font-size: 12px; color: #666; margin: 4px 0; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
            .item-name { flex: 1; }
            .totals { margin-top: 8px; }
            .totals .item { font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
            @media print { body { margin: 0; padding: 10px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={!!receipt} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-none sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Receipt #{receipt.id}</DialogTitle>
        </DialogHeader>
        <div ref={printRef}>
          <div className="header" style={{ textAlign: "center", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "18px", margin: 0, fontFamily: "serif" }}>Trey Baker</h1>
            <p style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>
              {new Date(receipt.date).toLocaleString()}
            </p>
            <p style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>
              Cashier: {receipt.createdBy}
            </p>
          </div>
          <div style={{ borderTop: "1px dashed #ccc", margin: "12px 0" }} />
          <div className="space-y-1">
            {(receipt as any).items?.map((item: ReceiptItem, idx: number) => (
              <div key={idx} className="flex justify-between text-sm" data-testid={`receipt-view-item-${idx}`}>
                <span className="flex-1">
                  {item.quantity}x {item.itemName}
                </span>
                <span className="font-mono">${parseFloat(item.lineTotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #ccc", margin: "12px 0" }} />
          <div className="space-y-1">
            <div className="flex justify-between text-sm" style={{ color: "#666" }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: "monospace" }}>${parseFloat(receipt.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat((receipt as any).discountPercent ?? "0") > 0 && (
              <div className="flex justify-between text-sm" style={{ color: "#c00" }}>
                <span>Discount ({parseFloat((receipt as any).discountPercent).toFixed(0)}% off)</span>
                <span style={{ fontFamily: "monospace" }}>−${(parseFloat(receipt.subtotal) * parseFloat((receipt as any).discountPercent) / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base" style={{ borderTop: "1px dashed #ccc", paddingTop: "6px", marginTop: "4px" }}>
              <span>Total</span>
              <span style={{ fontFamily: "monospace" }}>${parseFloat(receipt.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handlePrint} className="rounded-none w-full gap-2" data-testid="button-print-receipt">
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const canDelete = user?.role === "Owner" || user?.role === "Manager";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showNewReceipt, setShowNewReceipt] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isEmployeeMeal, setIsEmployeeMeal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<(Receipt & { items?: ReceiptItem[] }) | null>(null);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "meal">("all");

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: allReceipts = [], isLoading } = useQuery<Receipt[]>({
    queryKey: ["/api/receipts"],
    queryFn: async () => {
      const res = await fetch("/api/receipts");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      items: { menuItemId: number | null; itemName: string; quantity: number; unitPrice: string }[];
    }) => {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setShowNewReceipt(false);
      setCart([]);
      toast({ title: "Receipt Created", description: `Receipt #${data.id} has been saved.` });
      setViewingReceipt(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      toast({ title: "Receipt Deleted", description: "Receipt has been removed.", variant: "destructive" });
    },
  });

  const viewReceipt = async (id: number) => {
    const res = await fetch(`/api/receipts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setViewingReceipt(data);
    }
  };

  const addMenuItemToCart = () => {
    if (!selectedItem) return;
    const item = menuItems.find(m => m.id === parseInt(selectedItem));
    if (!item) return;
    const existing = cart.findIndex(c => c.menuItemId === item.id);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].quantity += 1;
      updated[existing].lineTotal = updated[existing].quantity * updated[existing].unitPrice;
      setCart(updated);
    } else {
      const price = parseFloat(item.basePrice);
      setCart([...cart, { menuItemId: item.id, itemName: item.name, quantity: 1, unitPrice: price, lineTotal: price }]);
    }
    setSelectedItem("");
  };

  const addCustomItem = () => {
    if (!customName || !customPrice) return;
    const price = parseFloat(customPrice);
    setCart([...cart, { menuItemId: null, itemName: customName, quantity: 1, unitPrice: price, lineTotal: price }]);
    setCustomName("");
    setCustomPrice("");
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);
    updated[index].lineTotal = updated[index].quantity * updated[index].unitPrice;
    setCart(updated);
  };

  const setQuantityDirect = (index: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    const updated = [...cart];
    updated[index].quantity = num;
    updated[index].lineTotal = num * updated[index].unitPrice;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountPct = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
  const discountAmount = subtotal * (discountPct / 100);
  const total = isEmployeeMeal ? 0 : subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    createMutation.mutate({
      items: cart.map(i => ({
        menuItemId: i.menuItemId,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toFixed(2),
      })),
      isEmployeeMeal,
      discountPercent: discountPct,
    } as any);
  };

  const todayReceipts = allReceipts.filter(r => {
    const d = new Date(r.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayTotal = todayReceipts.reduce((s, r) => s + parseFloat(r.total), 0);

  const filteredReceipts = allReceipts.filter(r => {
    const d = new Date(r.date);
    const now = new Date();

    if (dateFilter === "today") {
      if (d.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      if (d < weekAgo) return false;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
      if (d < monthAgo) return false;
    }

    if (typeFilter === "regular" && (r as any).isEmployeeMeal) return false;
    if (typeFilter === "meal" && !(r as any).isEmployeeMeal) return false;

    const q = search.toLowerCase();
    if (q) {
      const matchesCashier = r.createdBy.toLowerCase().includes(q);
      const matchesId = String(r.id).includes(q);
      if (!matchesCashier && !matchesId) return false;
    }

    return true;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Receipts</h1>
            <p className="text-muted-foreground max-w-2xl">
              Create receipts by adding menu items. Totals are calculated automatically with tax.
            </p>
          </div>
          <Button
            className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            onClick={() => setShowNewReceipt(true)}
            data-testid="button-new-receipt"
          >
            <Plus className="h-4 w-4" /> New Receipt
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">Today's Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="text-today-sales">${todayTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">Today's Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold" data-testid="text-today-count">{todayReceipts.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">All Time Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold" data-testid="text-total-count">{allReceipts.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by cashier or receipt #..."
              className="rounded-none border-muted pl-9"
              data-testid="input-receipt-search"
            />
          </div>
          <div className="flex gap-1 border border-border p-1">
            {(["all", "today", "week", "month"] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                data-testid={`filter-date-${f}`}
                className={`px-3 py-1 text-xs font-mono transition-colors ${dateFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f === "all" ? "All Time" : f === "today" ? "Today" : f === "week" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border border-border p-1">
            {(["all", "regular", "meal"] as const).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                data-testid={`filter-type-${f}`}
                className={`px-3 py-1 text-xs font-mono transition-colors ${typeFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f === "all" ? "All" : f === "regular" ? "Regular" : "Employee Meals"}
              </button>
            ))}
          </div>
        </div>

        {showNewReceipt && (
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">New Receipt</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowNewReceipt(false); setCart([]); setIsEmployeeMeal(false); setDiscountPercent(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Add Menu Item</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger className="rounded-none border-muted" data-testid="select-menu-item">
                      <SelectValue placeholder="Select a menu item..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {menuItems.map(item => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name} - ${parseFloat(item.basePrice).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="rounded-none" onClick={addMenuItemToCart} data-testid="button-add-to-cart">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Custom Item</Label>
                  <Input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Item name"
                    className="rounded-none border-muted"
                    data-testid="input-custom-item-name"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-none border-muted"
                    data-testid="input-custom-item-price"
                  />
                </div>
                <Button size="sm" variant="outline" className="rounded-none" onClick={addCustomItem} data-testid="button-add-custom">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border">
                <button
                  type="button"
                  data-testid="toggle-employee-meal-off"
                  onClick={() => setIsEmployeeMeal(false)}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium transition-colors ${!isEmployeeMeal ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Regular Sale
                </button>
                <button
                  type="button"
                  data-testid="toggle-employee-meal-on"
                  onClick={() => setIsEmployeeMeal(true)}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium transition-colors ${isEmployeeMeal ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Employee Meal (Free)
                </button>
              </div>

              {cart.length > 0 && (
                <div className="border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-serif text-primary font-bold">Item</TableHead>
                        <TableHead className="font-serif text-primary font-bold w-[120px] text-center">Qty</TableHead>
                        <TableHead className="font-serif text-primary font-bold text-right">Price</TableHead>
                        <TableHead className="font-serif text-primary font-bold text-right">Total</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, idx) => (
                        <TableRow key={idx} data-testid={`cart-item-${idx}`}>
                          <TableCell className="font-medium text-sm">{item.itemName}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(idx, -1)} data-testid={`button-qty-minus-${idx}`}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => setQuantityDirect(idx, e.target.value)}
                                onFocus={e => e.target.select()}
                                className="font-mono text-sm w-12 text-center border border-border bg-background px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                data-testid={`input-qty-${idx}`}
                              />
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(idx, 1)} data-testid={`button-qty-plus-${idx}`}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold">${item.lineTotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFromCart(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 bg-muted/10 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>

                    {!isEmployeeMeal && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Discount</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={discountPercent}
                            onChange={e => setDiscountPercent(e.target.value)}
                            placeholder="0"
                            className="rounded-none border-muted h-7 text-sm w-16 text-right"
                            data-testid="input-discount-percent"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          {discountAmount > 0 && (
                            <span className="font-mono text-sm text-red-600">−${discountAmount.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="font-mono text-primary" data-testid="text-total">
                        {isEmployeeMeal
                          ? <span className="text-green-700">$0.00 <span className="text-xs font-normal">(Employee Meal)</span></span>
                          : `$${total.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="rounded-none w-full gap-2 text-base py-6"
                onClick={handleCheckout}
                disabled={cart.length === 0 || createMutation.isPending}
                data-testid="button-checkout"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-5 w-5" />}
                {isEmployeeMeal ? "Log Employee Meal — $0.00" : discountPct > 0 ? `Complete Sale — $${total.toFixed(2)} (${discountPct}% off)` : `Complete Sale — $${total.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : allReceipts.length === 0 && !showNewReceipt ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed border-border bg-muted/10">
            <ReceiptText className="h-10 w-10 mb-3 opacity-50" />
            <p>No receipts yet. Click "New Receipt" to create your first sale.</p>
          </div>
        ) : allReceipts.length > 0 && (
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-serif text-primary font-bold">#</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Date</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Cashier</TableHead>
                  <TableHead className="font-serif text-primary font-bold text-right">Total</TableHead>
                  <TableHead className="font-serif text-primary font-bold text-center">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No receipts match your filters.
                    </TableCell>
                  </TableRow>
                ) : filteredReceipts.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="cursor-pointer hover:bg-muted/20"
                    onClick={() => viewReceipt(receipt.id)}
                    data-testid={`receipt-row-${receipt.id}`}
                  >
                    <TableCell className="font-mono text-sm">#{receipt.id}</TableCell>
                    <TableCell className="text-sm">{new Date(receipt.date).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{receipt.createdBy}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">${parseFloat(receipt.total).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <Badge variant="secondary" className="rounded-none font-mono text-xs">{receipt.status}</Badge>
                        {(receipt as any).isEmployeeMeal && (
                          <Badge className="rounded-none font-mono text-xs bg-green-100 text-green-800 hover:bg-green-100" data-testid={`badge-employee-meal-${receipt.id}`}>Employee Meal</Badge>
                        )}
                        {parseFloat((receipt as any).discountPercent ?? "0") > 0 && (
                          <Badge className="rounded-none font-mono text-xs bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1" data-testid={`badge-discount-${receipt.id}`}>
                            <Tag className="h-2.5 w-2.5" />{parseFloat((receipt as any).discountPercent).toFixed(0)}% off
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => viewReceipt(receipt.id)} data-testid={`button-view-receipt-${receipt.id}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => deleteMutation.mutate(receipt.id)}
                            data-testid={`button-delete-receipt-${receipt.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ReceiptViewDialog receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </Layout>
  );
}
