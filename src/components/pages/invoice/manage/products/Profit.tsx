import { Column } from "../../Product";
import { memo } from "react";
import { numberParser } from "@/tools/numberPaser";
import { productResult } from "@/components/pages/invoice/ProductList";

type props = {
  sellerHasInventory: boolean | undefined;
  remainStockTotals: productResult;
};

export const Profit = memo(function Profit({
  sellerHasInventory,
  remainStockTotals,
}: props) {
  return (
    <Column
      gridColumn={!sellerHasInventory ? "-2 / -3" : ""}
      title={numberParser(remainStockTotals.profit)}
    >
      {numberParser(remainStockTotals.profit)}
    </Column>
  );
});
