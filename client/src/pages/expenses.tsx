import { Layout } from "@/components/Layout";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const { toast } = useToast();

  const handleExportCSV = () => {
    toast({
      title: "Exporting CSV",
      description: "Your expense report is being generated and will download shortly.",
    });
  };

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
            <Button 
              variant="outline" 
              className="gap-2 font-mono text-xs rounded-none"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast({ title: "Pagination", description: "This is a prototype view. Previous page coming in full version." })}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({ title: "Pagination", description: "This is a prototype view. Next page coming in full version." })}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
