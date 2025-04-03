import { Column } from "../../Product";
import { memo, useMemo } from "react";
import { numberParser } from "@/tools/numberPaser";
import { rawOutput } from "./AddOutput";

type props = {
  sellerHasInventory: boolean | undefined;
  remainStock: rawOutput[];
};

export const Profit = memo(function Profit({
  sellerHasInventory,
  remainStock,
}: props) {
  const total = useMemo(() => {
    if (remainStock.length === 0) return "0.00";

    const results = remainStock.reduce(
      (acc, next) => {
        return {
          purchase_total:
            acc.purchase_total + next.amount * next.purchase_price,
          sale_total: acc.sale_total + next.amount * next.sale_price,
        };
      },
      {
        purchase_total: 0,
        sale_total: 0,
      }
    );

    return numberParser(results.sale_total - results.purchase_total);
  }, [remainStock]);

  return (
    <Column gridColumn={!sellerHasInventory ? "-2 / -3" : ""} title={total}>
      {total}
    </Column>
  );
});
