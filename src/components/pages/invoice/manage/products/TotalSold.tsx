import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";
import { productResult } from "@/components/pages/invoice/ProductList";

type props = {
  remainStockTotals: productResult;
  sellerHasInventory: boolean | undefined;
};

export function TotalSold({ remainStockTotals, sellerHasInventory }: props) {
  return (
    <Column
      gridColumn={!sellerHasInventory ? "span 3" : ""}
      printGridColumn={sellerHasInventory ? "span 2" : "span -3"}
      title={numberParser(remainStockTotals.sold)}
      $textAlign="center"
    >
      {numberParser(remainStockTotals.sold)}
    </Column>
  );
}
