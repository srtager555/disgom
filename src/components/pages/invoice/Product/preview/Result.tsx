import { Container } from "@/styles/index.styles";
import { useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";
import { rawProduct } from "@/trash/preview";
import { Column } from "..";
import { ProductContainer } from "../../ProductList";

type props = {
  hasInventory?: boolean;
  rawProducts: Record<string, rawProduct>;
};

export function Result({ hasInventory, rawProducts }: props) {
  const [purchaseValue, setPurchaseValue] = useState<number>(0);
  const [salesValues, setSalesValues] = useState<{
    seller: number;
    normal: number;
  }>({ seller: 0, normal: 0 });

  useEffect(() => {
    const values = Object.values(rawProducts);
    if (values.length === 0) return;

    setPurchaseValue(
      values
        .map((el) => {
          return el.purchases_amounts.reduce((before, now) => {
            return before + now.total;
          }, 0);
        })
        .reduce((before, now) => before + now)
    );

    setSalesValues(
      values
        .map((el) => {
          return el.sales_amounts.reduce(
            (before, now) => {
              return {
                normal: before.normal + now.normal_total,
                seller: before.seller + now.seller_total,
              };
            },
            {
              seller: 0,
              normal: 0,
            }
          );
        })
        .reduce((before, now) => ({
          seller: before.seller + now.seller,
          normal: before.normal + now.normal,
        }))
    );
  }, [rawProducts]);

  return (
    <Container styles={{ margin: "50px 0" }}>
      <ProductContainer $hasInventory={hasInventory} $withoutStock={1}>
        <Column gridColumn="4 / 6">Costo </Column>
        <Column gridColumn="6 / 8" printGridColumn="-1 / -5" $left>
          Total a pagar
        </Column>
        <Column gridColumn="8 / 10">Ganancias</Column>
      </ProductContainer>
      <ProductContainer $hasInventory={hasInventory} $withoutStock={1}>
        <Column gridColumn="4 / 6" title={numberParser(purchaseValue)}>
          {numberParser(purchaseValue)}
        </Column>
        <Column
          gridColumn="6 / 8"
          printGridColumn="-1 / -4"
          title={numberParser(salesValues.normal)}
        >
          {numberParser(salesValues.normal)}
        </Column>
        <Column
          gridColumn="8 / 10"
          title={numberParser(salesValues.normal - purchaseValue)}
        >
          {numberParser(salesValues.normal - purchaseValue)}
        </Column>
      </ProductContainer>
    </Container>
  );
}
