import { useEffect, useState } from "react";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { productResult } from "@/components/pages/invoice/ProductList";
import { useInvoice } from "@/contexts/InvoiceContext";
import { isEqual } from "lodash";

export function useCalculateProductTotals(remainStock: rawOutput[]) {
  const { invoice } = useInvoice();
  const [remainStockTotals, setRemainStockTotals] = useState<productResult>({
    amount: 0,
    cost: 0,
    sold: 0,
    profit: 0,
    seller_sold: 0,
    seller_profit: 0,
  });

  useEffect(() => {
    const results = remainStock.reduce<productResult>(
      (acc, stock) => {
        const multiplicator =
          invoice?.data()?.invoice_type === "normal" ? 1 : -1;
        const amount = stock.amount;
        const cost = stock.purchase_price * amount * multiplicator;
        const sold = stock.sale_price * amount * multiplicator;
        const profit = sold - cost;
        const seller_profit = stock.commission * amount * multiplicator;
        const seller_sold = sold + seller_profit;

        return {
          amount: acc.amount + amount,
          cost: acc.cost + cost,
          sold: acc.sold + sold,
          profit: acc.profit + profit,
          seller_sold: acc.seller_sold + seller_sold,
          seller_profit: acc.seller_profit + seller_profit,
        };
      },
      {
        amount: 0,
        cost: 0,
        sold: 0,
        profit: 0,
        seller_sold: 0,
        seller_profit: 0,
      }
    );

    if (!isEqual(results, remainStockTotals)) {
      setRemainStockTotals(results);
    }
  }, [remainStock, invoice, remainStockTotals]);

  return remainStockTotals;
}
