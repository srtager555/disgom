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
      className="hide-print"
      hideOnPrint
      gridColumn={!sellerHasInventory ? "span 2" : ""}
      printGridColumn={!sellerHasInventory ? "-3 / -6" : ""}
      $textAlign="center"
      title={numberParser(remainStockTotals.profit)}
    >
      {numberParser(remainStockTotals.profit)}
    </Column>
  );
});
