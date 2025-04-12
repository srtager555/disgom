import { productResult } from "@/components/pages/invoice/ProductList";
import { useState } from "react";

type TotalResults = {
  totalAmount: number;
  totalCost: number;
  totalSold: number;
  totalProfit: number;
  totalSellerSold: number;
  totalSellerProfit: number;
};

export const useProductResults = () => {
  const [totalResults, setTotalResults] = useState<TotalResults>({
    totalAmount: 0,
    totalCost: 0,
    totalSold: 0,
    totalProfit: 0,
    totalSellerSold: 0,
    totalSellerProfit: 0,
  });

  const calculateResults = (productsResults: Record<string, productResult>) => {
    const totals = Object.values(productsResults).reduce(
      (acc, product) => ({
        totalAmount: acc.totalAmount + product.amount,
        totalCost: acc.totalCost + product.cost,
        totalSold: acc.totalSold + product.sold,
        totalProfit: acc.totalProfit + product.profit,
        totalSellerSold: acc.totalSellerSold + product.seller_sold,
        totalSellerProfit: acc.totalSellerProfit + product.seller_profit,
      }),
      {
        totalAmount: 0,
        totalCost: 0,
        totalSold: 0,
        totalProfit: 0,
        totalSellerSold: 0,
        totalSellerProfit: 0,
      }
    );

    setTotalResults(totals);
    return totals;
  };

  return { totalResults, calculateResults };
};
