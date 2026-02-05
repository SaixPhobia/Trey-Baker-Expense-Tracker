import { Layout } from "@/components/Layout";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Filter } from "lucide-react";

export default function ExpensesPage() {
  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Expenses</h1>
            <p className="text-muted-foreground max-w-2xl">
              Track and approve operational costs. Ensure all receipts are uploaded by end of week.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 font-mono text-xs">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button className="gap-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New Expense
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 border border-border shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search expenses..." 
              className="pl-9 font-mono text-sm border-muted"
            />
          </div>
          <div className="flex gap-2 ml-auto">
             <Button variant="ghost" size="sm" className="text-xs">Filter by Date</Button>
             <Button variant="ghost" size="sm" className="text-xs">Category</Button>
             <Button variant="ghost" size="sm" className="text-xs">Status</Button>
          </div>
        </div>

        <ExpenseTable />
        
        {/* Pagination Mock */}
        <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
          <p>Showing 1-5 of 24 results</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
