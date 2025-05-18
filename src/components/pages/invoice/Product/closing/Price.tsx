import { sales_amounts } from "@/trash/preview";
import { Column } from "..";
import { numberParser } from "@/tools/numberPaser";

type props = {
  data: sales_amounts;
};

export function Price({ data }: props) {
  return (
    <>
      <Column gridColumn="5 / 6" title={numberParser(data.amount)}>
        {numberParser(data.amount)}
      </Column>
      <Column gridColumn="11 / 12">{numberParser(data.normal_price)}</Column>
      <Column gridColumn="12 / 13" title={numberParser(data.normal_total)}>
        {numberParser(data.normal_total)}
      </Column>

      <Column gridColumn="14 / 15">{numberParser(data.seller_price)}</Column>
      <Column gridColumn="15 / 16" title={numberParser(data.seller_total)}>
        {numberParser(data.seller_total)}
      </Column>
    </>
  );
}
