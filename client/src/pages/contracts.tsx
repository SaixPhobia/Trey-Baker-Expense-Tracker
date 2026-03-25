import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, FileSignature, Pencil, Phone, Mail, User, Calendar, RefreshCw, DollarSign, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  items: "",
  quantityPerDelivery: "",
  frequency: "Weekly",
  pricePerDelivery: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  status: "Active",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

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
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <DialogContent className="rounded-none sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
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
          <Label>Items / Products *</Label>
          <Textarea
            data-testid="input-contract-items"
            value={form.items}
            onChange={e => set("items", e.target.value)}
            placeholder="e.g. 30 sourdough loaves, 20 croissants, 10 baguettes"
            className="rounded-none border-muted resize-none h-20"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="grid gap-2 col-span-2">
            <Label>Quantity per Delivery</Label>
            <Input
              data-testid="input-contract-quantity"
              value={form.quantityPerDelivery}
              onChange={e => set("quantityPerDelivery", e.target.value)}
              placeholder="e.g. 50 units total"
              className="rounded-none border-muted"
            />
          </div>
          <div className="grid gap-2">
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
            <Label>Price / Delivery ($)</Label>
            <Input
              type="number"
              step="0.01"
              data-testid="input-contract-price"
              value={form.pricePerDelivery}
              onChange={e => set("pricePerDelivery", e.target.value)}
              placeholder="0.00"
              className="rounded-none border-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          onClick={() => onSave(form)}
          disabled={isPending || !form.companyName || !form.items}
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
  return {
    companyName: c.companyName,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    contactEmail: c.contactEmail,
    items: c.items,
    quantityPerDelivery: c.quantityPerDelivery,
    frequency: c.frequency,
    pricePerDelivery: parseFloat(c.pricePerDelivery).toString(),
    startDate: new Date(c.startDate).toISOString().split("T")[0],
    endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
    status: c.status,
    notes: c.notes,
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
        body: JSON.stringify({
          ...form,
          pricePerDelivery: form.pricePerDelivery || "0",
          startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        }),
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
        body: JSON.stringify({
          ...form,
          pricePerDelivery: form.pricePerDelivery || "0",
          startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        }),
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
      const multipliers: Record<string, number> = { Weekly: 4, "Bi-weekly": 2, Monthly: 1, "Bi-monthly": 0.5, Quarterly: 0.33, "One-time": 0 };
      return sum + price * (multipliers[c.frequency] ?? 1);
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

        <div className="flex gap-1 border border-border p-1 self-start">
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
            {filtered.map(contract => (
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
                  <div className="bg-muted/20 p-3 border-l-2 border-primary">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Products</p>
                    <p className="text-sm">{contract.items}</p>
                    {contract.quantityPerDelivery && (
                      <p className="text-xs text-muted-foreground mt-1">Qty: {contract.quantityPerDelivery}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Price / Delivery</p>
                      <p className="font-mono font-bold text-primary">${parseFloat(contract.pricePerDelivery).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Start Date</p>
                      <p className="font-mono text-sm">{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                    {contract.endDate && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">End Date</p>
                        <p className="font-mono text-sm">{new Date(contract.endDate).toLocaleDateString()}</p>
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
            ))}
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
