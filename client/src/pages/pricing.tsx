import { Layout } from "@/components/Layout";
import { PriceCalculator } from "@/components/PriceCalculator";

export default function PricingPage() {
  return (
    <Layout>
      <div className="flex flex-col gap-8">
         <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">Price Calculator</h1>
            <p className="text-muted-foreground max-w-2xl">
              Determine the optimal retail price for your products based on ingredient costs, labor, and desired profit margins.
            </p>
          </div>
        </div>
        
        <PriceCalculator />
      </div>
    </Layout>
  );
}
