import { numberParser } from "@/tools/numberPaser";
import { Column } from "..";
import { inventoryProductDoc } from "@/tools/sellers/invetory/addProduct";

export type props = {
  data: inventoryProductDoc;
};

export function Inv({ data }: props) {
  return (
    <>
      <Column gridColumn="4 / 5">{data.amount}</Column>
      <Column gridColumn="9 / 10">{numberParser(data.purchase_price)}</Column>
      <Column
        gridColumn="10 / 11"
        title={numberParser(data.purchase_price * data.amount)}
      >
        {numberParser(data.purchase_price * data.amount)}
      </Column>
    </>
  );
}

interface InvPriceProps extends props {
  normal: number;
  seller: number;
}

export function InvPrice({ data, normal, seller }: InvPriceProps) {
  return (
    <>
      <Column gridColumn="4 / 5">{data.amount}</Column>
      <Column gridColumn="11 / 12">{numberParser(normal)}</Column>
      <Column gridColumn="12 / 13" title={numberParser(normal * data.amount)}>
        {numberParser(normal * data.amount)}
      </Column>
      <Column gridColumn="14 / 15">{numberParser(seller)}</Column>
      <Column gridColumn="15 / 16" title={numberParser(seller * data.amount)}>
        {numberParser(seller * data.amount)}
      </Column>
    </>
  );
}
