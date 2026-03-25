import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, FileSignature, Pencil, Phone, Mail, User, Calendar, RefreshCw, X, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MenuItem } from "@shared/schema";
import { SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContractOrder } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const FREQUENCIES = ["Weekly", "Bi-weekly", "Monthly", "Bi-monthly", "Quarterly", "One-time"];
const STATUSES = ["Active", "Paused", "Completed", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Paused: "bg-yellow-100 text-yellow-800",
  Completed: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
};

const FREQ_MULTIPLIERS: Record<string, number> = {
  Weekly: 4,
  "Bi-weekly": 2,
  Monthly: 1,
  "Bi-monthly": 0.5,
  Quarterly: 0.33,
  "One-time": 0,
};

export interface LineItem {
  name: string;
  qty: string;
  unitPrice: string;
  menuItemId: string;
}

const EMPTY_LINE_ITEM: LineItem = { name: "", qty: "", unitPrice: "", menuItemId: "" };

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  lineItems: [{ ...EMPTY_LINE_ITEM }] as LineItem[],
  deliveryFee: "",
  frequency: "Weekly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  status: "Active",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

function calcSubtotal(lineItems: LineItem[]) {
  return lineItems.reduce((sum, li) => {
    const qty = parseFloat(li.qty) || 0;
    const price = parseFloat(li.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
}

function calcTotal(lineItems: LineItem[], deliveryFee: string) {
  return calcSubtotal(lineItems) + (parseFloat(deliveryFee) || 0);
}

function parseLineItems(raw: string): LineItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((li: any) => ({
        name: li.name ?? "",
        qty: li.qty ?? "",
        unitPrice: li.unitPrice ?? "",
        menuItemId: li.menuItemId ?? "",
      }));
    }
  } catch {}
  return [{ ...EMPTY_LINE_ITEM }];
}

function ContractForm({
  initial,
  onSave,
  onCancel,
  isPending,
  title,
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
  title: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu-items");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const menuCategories = Array.from(new Set(menuItems.map(m => m.category))).sort();

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setForm(f => {
      const updated = f.lineItems.map((li, i) => i === index ? { ...li, [field]: value } : li);
      return { ...f, lineItems: updated };
    });
  };

  const selectMenuItem = (index: number, value: string) => {
    if (value === "__custom__") {
      setForm(f => {
        const updated = f.lineItems.map((li, i) =>
          i === index ? { ...li, menuItemId: "__custom__", name: "", unitPrice: "" } : li
        );
        return { ...f, lineItems: updated };
      });
    } else {
      const item = menuItems.find(m => String(m.id) === value);
      if (!item) return;
      setForm(f => {
        const updated = f.lineItems.map((li, i) =>
          i === index ? { ...li, menuItemId: value, name: item.name, unitPrice: parseFloat(item.basePrice).toFixed(2) } : li
        );
        return { ...f, lineItems: updated };
      });
    }
  };

  const addLineItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE_ITEM }] }));

  const removeLineItem = (index: number) =>
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== index) }));

  const subtotal = calcSubtotal(form.lineItems);
  const fee = parseFloat(form.deliveryFee) || 0;
  const total = subtotal + fee;
  const totalQty = form.lineItems.reduce((s, li) => s + (parseFloat(li.qty) || 0), 0);

  const canSave = form.companyName.trim() && form.lineItems.some(li => li.name.trim());

  const handleSave = () => {
    onSave({ ...form, lineItems: form.lineItems.filter(li => li.name.trim()) });
  };

  return (
    <DialogContent className="rounded-none sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-serif">{title}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-5 py-4">
        <div className="grid gap-2">
          <Label>Company Name *</Label>
          <Input
            data-testid="input-contract-company"
            value={form.companyName}
            onChange={e => set("companyName", e.target.value)}
            placeholder="e.g. City Café Chain"
            className="rounded-none border-muted"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Contact Person</Label>
            <Input
              data-testid="input-contract-contact-name"
              value={form.contactName}
              onChange={e => set("contactName", e.target.value)}
              placeholder="Name"
              className="rounded-none border-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input
              data-testid="input-contract-phone"
              value={form.contactPhone}
              onChange={e => set("contactPhone", e.target.value)}
              placeholder="(555) 000-0000"
              className="rounded-none border-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              data-testid="input-contract-email"
              value={form.contactEmail}
              onChange={e => set("contactEmail", e.target.value)}
              placeholder="buyer@company.com"
              className="rounded-none border-muted"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Items per Delivery *</Label>
          <div className="border border-border">
            <div className="grid grid-cols-[1fr_60px_84px_70px_32px] gap-0 bg-muted/30 px-2 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider border-b border-border">
              <span className="pl-1">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right pr-2">Unit Price</span>
              <span className="text-right pr-2">Total</span>
              <span />
            </div>
            {form.lineItems.map((li, i) => {
              const rowTotal = (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
              const isCustom = li.menuItemId === "__custom__" || li.menuItemId === "";
              return (
                <div key={i} className="border-t border-border first:border-t-0" data-testid={`line-item-row-${i}`}>
                  <div className="grid grid-cols-[1fr_60px_84px_70px_32px] gap-0">
                    <div className="border-r border-border">
                      <Select
                        value={li.menuItemId || ""}
                        onValueChange={v => selectMenuItem(i, v)}
                      >
                        <SelectTrigger
                          className="rounded-none border-0 h-9 text-sm focus:ring-0 focus-visible:ring-0 shadow-none px-2"
                          data-testid={`select-line-item-menu-${i}`}
                        >
                          <SelectValue placeholder="Choose item…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="__custom__">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <PenLine className="h-3 w-3" /> Custom item…
                            </span>
                          </SelectItem>
                          <SelectSeparator />
                          {menuCategories.map(cat => (
                            <SelectGroup key={cat}>
                              <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{cat}</SelectLabel>
                              {menuItems.filter(m => m.category === cat).map(m => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  <span className="flex items-center justify-between gap-4 w-full">
                                    <span>{m.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">${parseFloat(m.basePrice).toFixed(2)}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={li.qty}
                      onChange={e => updateLineItem(i, "qty", e.target.value)}
                      placeholder="0"
                      className="rounded-none border-0 border-r border-border h-9 text-sm text-center focus-visible:ring-0"
                      data-testid={`input-line-item-qty-${i}`}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.unitPrice}
                      onChange={e => updateLineItem(i, "unitPrice", e.target.value)}
                      placeholder="0.00"
                      className="rounded-none border-0 border-r border-border h-9 text-sm text-right focus-visible:ring-0"
                      data-testid={`input-line-item-price-${i}`}
                    />
                    <div className="flex items-center justify-end px-2 border-r border-border text-sm font-mono text-muted-foreground">
                      {rowTotal > 0 ? `$${rowTotal.toFixed(2)}` : "—"}
                    </div>
                    <button
                      onClick={() => removeLineItem(i)}
                      disabled={form.lineItems.length === 1}
                      className="flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                      data-testid={`button-remove-line-item-${i}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isCustom && (
                    <div className="border-t border-border/50 px-2 py-1.5 bg-muted/10">
                      <Input
                        value={li.name}
                        onChange={e => updateLineItem(i, "name", e.target.value)}
                        placeholder="Type custom item name…"
                        className="rounded-none border-muted h-8 text-sm focus-visible:ring-0"
                        data-testid={`input-line-item-name-${i}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="border-t border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addLineItem}
                className="rounded-none h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                data-testid="button-add-line-item"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
          </div>

          <div className="bg-muted/20 border border-border p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({totalQty > 0 ? `${totalQty} items` : "—"})</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground shrink-0">Delivery Fee (optional)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deliveryFee}
                  onChange={e => set("deliveryFee", e.target.value)}
                  placeholder="0.00"
                  className="rounded-none border-muted h-7 text-sm w-24 text-right"
                  data-testid="input-contract-delivery-fee"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5">
              <span>Total per Delivery</span>
              <span className="font-mono text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="grid gap-2 col-span-2 sm:col-span-1">
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={v => set("frequency", v)}>
              <SelectTrigger className="rounded-none border-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              data-testid="input-contract-start-date"
              value={form.startDate}
              onChange={e => set("startDate", e.target.value)}
              className="rounded-none border-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label>End Date (optional)</Label>
            <Input
              type="date"
              data-testid="input-contract-end-date"
              value={form.endDate}
              onChange={e => set("endDate", e.target.value)}
              className="rounded-none border-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="rounded-none border-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Notes</Label>
          <Textarea
            data-testid="input-contract-notes"
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Delivery instructions, special requirements, payment terms..."
            className="rounded-none border-muted resize-none h-20"
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-none">Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={isPending || !canSave}
          className="rounded-none"
          data-testid="button-save-contract"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Contract
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function contractToForm(c: ContractOrder): FormState {
  const lineItems = parseLineItems(c.lineItems ?? "[]");
  return {
    companyName: c.companyName,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    contactEmail: c.contactEmail,
    lineItems,
    deliveryFee: parseFloat(c.deliveryFee ?? "0") > 0 ? parseFloat(c.deliveryFee ?? "0").toString() : "",
    frequency: c.frequency,
    startDate: new Date(c.startDate).toISOString().split("T")[0],
    endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
    status: c.status,
    notes: c.notes,
  };
}

function formToPayload(form: FormState) {
  const validItems = form.lineItems.filter(li => li.name.trim());
  const autoItems = validItems.map(li => `${li.qty ? `${li.qty}x ` : ""}${li.name}`).join(", ");
  const totalQty = validItems.reduce((s, li) => s + (parseFloat(li.qty) || 0), 0);
  const subtotal = calcSubtotal(validItems);
  const fee = parseFloat(form.deliveryFee) || 0;
  const total = subtotal + fee;

  return {
    companyName: form.companyName,
    contactName: form.contactName,
    contactPhone: form.contactPhone,
    contactEmail: form.contactEmail,
    items: autoItems || form.companyName,
    quantityPerDelivery: totalQty > 0 ? String(totalQty) : "",
    lineItems: JSON.stringify(validItems),
    frequency: form.frequency,
    pricePerDelivery: total.toFixed(2),
    deliveryFee: fee.toFixed(2),
    startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
    endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    status: form.status,
    notes: form.notes,
  };
}

export default function ContractsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "Owner" || user?.role === "Manager";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newOpen, setNewOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const { data: contracts = [], isLoading } = useQuery<ContractOrder[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: FormState) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setNewOpen(false);
      toast({ title: "Contract Added", description: "Contract has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save contract.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: number; form: FormState }) => {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setEditContract(null);
      toast({ title: "Contract Updated", description: "Changes have been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update contract.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract Removed", variant: "destructive" });
    },
  });

  const filtered = statusFilter === "All" ? contracts : contracts.filter(c => c.status === statusFilter);
  const activeCount = contracts.filter(c => c.status === "Active").length;
  const monthlyValue = contracts
    .filter(c => c.status === "Active")
    .reduce((sum, c) => {
      const price = parseFloat(c.pricePerDelivery);
      return sum + price * (FREQ_MULTIPLIERS[c.frequency] ?? 1);
    }, 0);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Contracts</h1>
            <p className="text-muted-foreground max-w-2xl">
              Track supply contracts with companies — products, delivery schedules, pricing, and contacts.
            </p>
          </div>
          {canManage && (
            <Button
              className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
              onClick={() => setNewOpen(true)}
              data-testid="button-new-contract"
            >
              <Plus className="h-4 w-4" /> New Contract
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">Total Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold" data-testid="text-total-contracts">{contracts.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold text-green-700" data-testid="text-active-contracts">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">Est. Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="text-monthly-value">${monthlyValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-1 border border-border p-1 self-start flex-wrap">
          {(["All", ...STATUSES] as string[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-status-${s.toLowerCase()}`}
              className={`px-3 py-1 text-xs font-mono transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed border-border bg-muted/10">
            <FileSignature className="h-10 w-10 mb-3 opacity-50" />
            <p>{contracts.length === 0 ? 'No contracts yet. Click "New Contract" to add your first one.' : "No contracts match this filter."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(contract => {
              const lineItems = parseLineItems(contract.lineItems ?? "[]");
              const hasStructured = lineItems.some(li => li.name);
              const subtotal = calcSubtotal(lineItems);
              const fee = parseFloat(contract.deliveryFee ?? "0");
              const total = parseFloat(contract.pricePerDelivery);

              return (
                <Card key={contract.id} className="rounded-none border-none shadow-sm" data-testid={`card-contract-${contract.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="font-serif text-lg">{contract.companyName}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge className={`rounded-none text-xs font-mono ${STATUS_COLORS[contract.status] ?? "bg-muted text-foreground"}`}>
                            {contract.status}
                          </Badge>
                          <Badge variant="outline" className="rounded-none text-xs font-mono gap-1">
                            <RefreshCw className="h-3 w-3" /> {contract.frequency}
                          </Badge>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditContract(contract)}
                            data-testid={`button-edit-contract-${contract.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(contract.id)}
                            data-testid={`button-delete-contract-${contract.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted/20 border-l-2 border-primary">
                      <div className="px-3 pt-2 pb-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Products per Delivery</p>
                      </div>
                      {hasStructured ? (
                        <>
                          <div className="grid grid-cols-[1fr_40px_70px_70px] text-xs font-mono text-muted-foreground px-3 pb-1 gap-2">
                            <span>Item</span>
                            <span className="text-center">Qty</span>
                            <span className="text-right">Unit $</span>
                            <span className="text-right">Total</span>
                          </div>
                          {lineItems.filter(li => li.name).map((li, i) => {
                            const row = (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
                            return (
                              <div key={i} className="grid grid-cols-[1fr_40px_70px_70px] text-sm px-3 py-1 gap-2 border-t border-border/50" data-testid={`card-line-item-${contract.id}-${i}`}>
                                <span className="truncate">{li.name}</span>
                                <span className="text-center font-mono text-muted-foreground">{li.qty || "—"}</span>
                                <span className="text-right font-mono text-muted-foreground">{li.unitPrice ? `$${parseFloat(li.unitPrice).toFixed(2)}` : "—"}</span>
                                <span className="text-right font-mono">{row > 0 ? `$${row.toFixed(2)}` : "—"}</span>
                              </div>
                            );
                          })}
                          <div className="px-3 pt-2 pb-2 border-t border-border space-y-1">
                            {subtotal > 0 && fee > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-mono">${subtotal.toFixed(2)}</span>
                              </div>
                            )}
                            {fee > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Delivery Fee</span>
                                <span className="font-mono">${fee.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-bold">
                              <span>Total / Delivery</span>
                              <span className="font-mono text-primary">${total.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="px-3 pb-3">
                          <p className="text-sm">{contract.items}</p>
                          {contract.quantityPerDelivery && (
                            <p className="text-xs text-muted-foreground mt-1">Qty: {contract.quantityPerDelivery}</p>
                          )}
                          <p className="font-mono font-bold text-primary mt-2">${total.toFixed(2)} / delivery</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Start Date</p>
                        <p className="font-mono text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(contract.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      {contract.endDate && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">End Date</p>
                          <p className="font-mono text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {(contract.contactName || contract.contactPhone || contract.contactEmail) && (
                      <div className="border-t border-border pt-3 space-y-1">
                        {contract.contactName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{contract.contactName}</span>
                          </div>
                        )}
                        {contract.contactPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono">{contract.contactPhone}</span>
                          </div>
                        )}
                        {contract.contactEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{contract.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {contract.notes && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">{contract.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <ContractForm
          title="New Contract"
          initial={EMPTY_FORM}
          onSave={form => createMutation.mutate(form)}
          onCancel={() => setNewOpen(false)}
          isPending={createMutation.isPending}
        />
      </Dialog>

      <Dialog open={!!editContract} onOpenChange={open => { if (!open) setEditContract(null); }}>
        {editContract && (
          <ContractForm
            title={`Edit — ${editContract.companyName}`}
            initial={contractToForm(editContract)}
            onSave={form => updateMutation.mutate({ id: editContract.id, form })}
            onCancel={() => setEditContract(null)}
            isPending={updateMutation.isPending}
          />
        )}
      </Dialog>
    </Layout>
  );
}
