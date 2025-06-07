import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";
import { productResult } from "@/components/pages/invoice/ProductList";

type props = {
  remainStockTotals: productResult;
  sellerHasInventory: boolean | undefined;
};

export function Commission({ remainStockTotals, sellerHasInventory }: props) {
  if (!sellerHasInventory) return <></>;

  return (
    <Column
      hideOnPrint
      className="hide-print"
      title={numberParser(remainStockTotals.seller_profit)}
    >
      {numberParser(remainStockTotals.seller_profit)}
    </Column>
  );
}
