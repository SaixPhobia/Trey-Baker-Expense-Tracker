import { Layout } from "@/components/Layout";
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
import { MoreHorizontal, Trash2, CheckCircle2, Clock, Plus, Loader2, ClipboardList, Package } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, MenuItem } from "@shared/schema";
import { useAuth } from "@/lib/auth";

export default function OrdersPage() {
  const { user } = useAuth();
  const canDelete = user?.role === "Owner" || user?.role === "Manager";
  const canUpdateStatus = user?.role === "Owner" || user?.role === "Manager";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({
    itemName: "",
    quantity: "1",
    notes: "",
    status: "Pending",
    submittedBy: user?.displayName || "",
  });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (order: typeof newOrder) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setNewOrder({ itemName: "", quantity: "1", notes: "", status: "Pending", submittedBy: user?.displayName || "" });
      toast({ title: "Order Submitted", description: "Your order has been placed." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order Updated", description: "Order status has been updated." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order Deleted", description: "Order has been removed.", variant: "destructive" });
    }
  });

  const handleSubmitOrder = () => {
    if (!newOrder.itemName || !newOrder.quantity) return;
    createMutation.mutate(newOrder);
  };

  const handleSelectMenuItem = (menuItemId: string) => {
    const item = menuItems.find(m => m.id.toString() === menuItemId);
    if (item) {
      setNewOrder({ ...newOrder, itemName: item.name });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const completedCount = orders.filter(o => o.status === "Completed").length;

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Orders</h1>
            <p className="text-muted-foreground max-w-2xl">
              Submit and track orders. All team members can place orders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <ClipboardList className="h-3 w-3" />
              TOTAL ORDERS
            </div>
            <p className="text-2xl font-bold font-mono" data-testid="text-total-orders">{orders.length}</p>
          </div>
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
              <Clock className="h-3 w-3" />
              PENDING
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600" data-testid="text-pending-orders">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
              <CheckCircle2 className="h-3 w-3" />
              COMPLETED
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600" data-testid="text-completed-orders">{completedCount}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none" data-testid="button-new-order">
                  <Plus className="h-4 w-4" /> New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-serif">Submit New Order</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="submittedBy">Your Name</Label>
                    <Input
                      id="submittedBy"
                      data-testid="input-order-submitted-by"
                      value={newOrder.submittedBy}
                      onChange={(e) => setNewOrder({ ...newOrder, submittedBy: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="rounded-none border-muted"
                    />
                  </div>
                  {menuItems.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Quick Add from Menu</Label>
                      <Select onValueChange={handleSelectMenuItem}>
                        <SelectTrigger className="rounded-none border-muted">
                          <SelectValue placeholder="Select a menu item..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {menuItems.map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} - ${parseFloat(item.basePrice).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      data-testid="input-order-item-name"
                      value={newOrder.itemName}
                      onChange={(e) => setNewOrder({ ...newOrder, itemName: e.target.value })}
                      placeholder="e.g. Croissant, Sourdough Loaf"
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      min="1"
                      data-testid="input-order-quantity"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                      placeholder="1"
                      className="rounded-none border-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      data-testid="input-order-notes"
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      className="rounded-none border-muted resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmitOrder} className="rounded-none w-full" disabled={createMutation.isPending} data-testid="button-submit-order">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-border rounded-none overflow-x-auto bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[80px] font-serif text-primary font-bold">ID</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Date</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Submitted By</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Item</TableHead>
                  <TableHead className="text-right font-serif text-primary font-bold">Qty</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Notes</TableHead>
                  <TableHead className="font-serif text-primary font-bold">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders yet. Click "New Order" to submit your first order.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/20 transition-colors duration-200 cursor-pointer" data-testid={`row-order-${order.id}`} onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{order.id}</TableCell>
                      <TableCell className="font-mono text-sm">{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-sm">{order.submittedBy || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          {order.itemName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {parseFloat(order.quantity).toFixed(0)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {order.notes || <span className="italic">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "rounded-none border-none font-normal px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          order.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          order.status === "In Progress" ? "bg-blue-50 text-blue-700" :
                          order.status === "Cancelled" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        )}>
                          {order.status === "Completed" ? <CheckCircle2 className="mr-1 h-3 w-3 inline" /> : <Clock className="mr-1 h-3 w-3 inline" />}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {canUpdateStatus || canDelete ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-muted rounded-none transition-colors" data-testid={`button-order-actions-${order.id}`}>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none">
                              {canUpdateStatus && order.status === "Pending" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, status: "In Progress" })}>
                                  Mark as In Progress
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus && (order.status === "Pending" || order.status === "In Progress") && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, status: "Completed" })}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Completed
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus && order.status !== "Cancelled" && order.status !== "Completed" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: order.id, status: "Cancelled" })}>
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(order.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <DialogContent className="rounded-none sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order #{selectedOrder?.id}
              </DialogTitle>
              <DialogDescription className="sr-only">Order details</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4" data-testid={`dialog-order-detail-${selectedOrder.id}`}>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn(
                    "rounded-none border-none font-normal px-3 py-1 text-xs uppercase tracking-wider",
                    selectedOrder.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                    selectedOrder.status === "In Progress" ? "bg-blue-50 text-blue-700" :
                    selectedOrder.status === "Cancelled" ? "bg-red-50 text-red-700" :
                    "bg-amber-50 text-amber-700"
                  )}>
                    {selectedOrder.status === "Completed" ? <CheckCircle2 className="mr-1 h-3 w-3 inline" /> : <Clock className="mr-1 h-3 w-3 inline" />}
                    {selectedOrder.status}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(selectedOrder.date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Item</p>
                    <p className="font-medium" data-testid="text-order-detail-item">{selectedOrder.itemName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quantity</p>
                    <p className="font-mono font-medium" data-testid="text-order-detail-qty">{parseFloat(selectedOrder.quantity).toFixed(0)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Submitted By</p>
                  <p className="font-medium" data-testid="text-order-detail-submitted-by">{selectedOrder.submittedBy || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-order-detail-notes">
                    {selectedOrder.notes || "No notes provided."}
                  </p>
                </div>

                {canUpdateStatus && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none text-xs gap-1"
                            data-testid="button-detail-in-progress"
                            onClick={() => {
                              updateMutation.mutate({ id: selectedOrder.id, status: "In Progress" });
                              setSelectedOrder({ ...selectedOrder, status: "In Progress" });
                            }}
                          >
                            <Clock className="h-3 w-3" /> In Progress
                          </Button>
                        )}
                        {(selectedOrder.status === "Pending" || selectedOrder.status === "In Progress") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            data-testid="button-detail-completed"
                            onClick={() => {
                              updateMutation.mutate({ id: selectedOrder.id, status: "Completed" });
                              setSelectedOrder({ ...selectedOrder, status: "Completed" });
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </Button>
                        )}
                        {selectedOrder.status !== "Cancelled" && selectedOrder.status !== "Completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            data-testid="button-detail-cancel"
                            onClick={() => {
                              updateMutation.mutate({ id: selectedOrder.id, status: "Cancelled" });
                              setSelectedOrder({ ...selectedOrder, status: "Cancelled" });
                            }}
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {canDelete && (
                  <>
                    <Separator />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-none text-xs gap-1 w-full"
                      data-testid="button-detail-delete"
                      onClick={() => {
                        deleteMutation.mutate(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete Order
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
