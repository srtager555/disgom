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
