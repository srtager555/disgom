import { Container } from "@/styles/index.styles";
import { ProductContainer, productResult } from "./ProductList";
import { useEffect, useState } from "react";
import { Column } from "./Product";
import { numberParser } from "@/tools/numberPaser";

interface productResultsFinal
  extends Omit<productResult, "sold" | "seller_sold"> {
  sold: number;
  seller_sold: number;
}

type props = {
  hasInventory?: boolean;
  productsResults: Record<string, productResult>;
};

export function Result({ hasInventory, productsResults }: props) {
  const [total, setTotal] = useState<productResultsFinal>();

  useEffect(() => {
    const values = Object.values(productsResults);
    if (values.length === 0) return;

    const total = values.reduce(
      (before, now) => {
        return {
          amount: 0,
          cost: before.cost + now.cost,
          sold: before.sold + now.sold.total,
          profit: before.profit + now.profit,
          seller_sold: before.seller_sold + now.seller_sold.total,
          seller_profit: before.seller_profit + now.seller_profit,
        };
      },
      {
        amount: 0,
        cost: 0,
        sold: 0,
        profit: 0,
        seller_sold: 0,
        seller_profit: 0,
      }
    );

    setTotal(total);
    console.log(total);
  }, [productsResults]);

  return (
    <Container styles={{ margin: "50px 0" }}>
      <ProductContainer $hasInventory={hasInventory} $withoutStock={1}>
        <Column gridColumn="4 / 6">Costo </Column>
        <Column gridColumn="6 / 8">Venta</Column>
        <Column gridColumn="8 / 10">Ganancias</Column>
        {hasInventory && (
          <>
            <Column gridColumn="10 / 12">Venta vendedor</Column>
            <Column gridColumn="12 / 14">Ganancias V.</Column>
          </>
        )}
      </ProductContainer>
      <ProductContainer $hasInventory={hasInventory} $withoutStock={1}>
        <Column gridColumn="4 / 6" title={total && numberParser(total.cost)}>
          {total ? numberParser(total.cost) : "0.00"}
        </Column>
        <Column gridColumn="6 / 8" title={total && numberParser(total.sold)}>
          {total ? numberParser(total.sold) : "0.00"}
        </Column>
        <Column gridColumn="8 / 10" title={total && numberParser(total.profit)}>
          {total ? numberParser(total.profit) : "0.00"}
        </Column>
        {hasInventory && (
          <>
            <Column
              gridColumn="10 / 12"
              title={total && numberParser(total.seller_sold)}
            >
              {total ? numberParser(total.seller_sold) : "0.00"}
            </Column>
            <Column
              gridColumn="12 / 14"
              title={total && numberParser(total.seller_profit)}
            >
              {total ? numberParser(total.seller_profit) : "0.00"}
            </Column>
          </>
        )}
      </ProductContainer>
    </Container>
  );
}
