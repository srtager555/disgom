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
    <Column title={numberParser(remainStockTotals.seller_sold)}>
      {numberParser(remainStockTotals.seller_sold)}
    </Column>
  );
}
