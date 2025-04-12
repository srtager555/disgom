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
      gridColumn={!sellerHasInventory ? "-3 / -4" : ""}
      title={numberParser(remainStockTotals.sold)}
    >
      {numberParser(remainStockTotals.sold)}
    </Column>
  );
}
