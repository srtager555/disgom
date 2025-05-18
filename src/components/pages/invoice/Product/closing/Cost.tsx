import { numberParser } from "@/tools/numberPaser";
import { Column } from "..";
import { purchases_amounts } from "@/trash/preview";

export type props = {
  data: purchases_amounts;
};

export function Cost({ data }: props) {
  return (
    <>
      <Column gridColumn="5 / 6">{data.amount}</Column>
      <Column gridColumn="9 / 10">{numberParser(data.price)}</Column>
      <Column gridColumn="10 / 11" title={numberParser(data.total)}>
        {numberParser(data.total)}
      </Column>
    </>
  );
}
