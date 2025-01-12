import { sales_amounts } from "@/pages/invoices/preview";
import { Column } from "..";
import { SellersDoc } from "@/tools/sellers/create";
import { numberParser } from "@/tools/numberPaser";

type props = {
  data: sales_amounts;
  sellerData: SellersDoc;
};

export function Price({ data, sellerData }: props) {
  return (
    <>
      <Column gridColumn="4 / 5" title={numberParser(data.amount)}>
        {numberParser(data.amount)}
      </Column>
      <Column gridColumn="7 / 8">{numberParser(data.normal_price)}</Column>
      <Column gridColumn="8 / 9" title={numberParser(data.normal_total)}>
        {numberParser(data.normal_total)}
      </Column>

      {sellerData.hasInventory && (
        <>
          <Column gridColumn="10 / 11">
            {numberParser(data.seller_price)}
          </Column>
          <Column gridColumn="11 / 12" title={numberParser(data.seller_total)}>
            {numberParser(data.seller_total)}
          </Column>
        </>
      )}
    </>
  );
}
