import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, ReceiptText, Minus, Printer, Eye, X } from "lucide-react";
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
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="font-mono">${parseFloat(receipt.total).toFixed(2)}</span>
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
  const [viewingReceipt, setViewingReceipt] = useState<(Receipt & { items?: ReceiptItem[] }) | null>(null);

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

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    createMutation.mutate({
      items: cart.map(i => ({
        menuItemId: i.menuItemId,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toFixed(2),
      })),
    });
  };

  const todayReceipts = allReceipts.filter(r => {
    const d = new Date(r.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayTotal = todayReceipts.reduce((s, r) => s + parseFloat(r.total), 0);

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

        {showNewReceipt && (
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">New Receipt</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowNewReceipt(false); setCart([]); }}>
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
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(idx, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-mono text-sm w-8 text-center">{item.quantity}</span>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(idx, 1)}>
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
                  <div className="p-4 bg-muted/10 border-t border-border space-y-1">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="font-mono text-primary" data-testid="text-total">${total.toFixed(2)}</span>
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
                Complete Sale - ${total.toFixed(2)}
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
          <div className="border border-border">
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
                {allReceipts.map((receipt) => (
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
                      <Badge variant="secondary" className="rounded-none font-mono text-xs">{receipt.status}</Badge>
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
