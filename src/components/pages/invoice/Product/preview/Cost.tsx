import { numberParser } from "@/tools/numberPaser";
import { Column } from "..";
import { purchases_amounts } from "@/trash/preview";

export type props = {
  data: purchases_amounts;
};

export function Cost({ data }: props) {
  return (
    <>
      <Column gridColumn="4 / 5">{data.amount}</Column>
      <Column gridColumn="5 / 6">{numberParser(data.price)}</Column>
      <Column gridColumn="6 / 7" title={numberParser(data.total)}>
        {numberParser(data.total)}
      </Column>
    </>
  );
}
