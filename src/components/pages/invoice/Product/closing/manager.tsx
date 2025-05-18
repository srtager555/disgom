import { Container } from "@/styles/index.styles";
import { ProductClosing } from ".";
import { Descriptions, rawProductWithInventory } from "@/trash/closing";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  inventory_product_data,
  inventoryProductDoc,
} from "@/tools/sellers/invetory/addProduct";
import { ProductContainer } from "../../ProductList";
import { Column } from "..";
import { numberParser } from "@/tools/numberPaser";
import { QueryDocumentSnapshot } from "firebase/firestore";

export type totals_sold = {
  total_purchase: number;
  total_sale: number;
  total_profit: number;
  total_seller_sale: number;
  total_seller_proft: number;
};

type props = {
  rawProducts: Record<string, rawProductWithInventory>;
  setInventories: Dispatch<
    SetStateAction<Record<string, inventory_product_data[]> | undefined>
  >;
  setProductTotals: Dispatch<SetStateAction<totals_sold | undefined>>;
  inventory: QueryDocumentSnapshot<inventoryProductDoc>[] | undefined;
};

export function ProductManager({
  rawProducts,
  setInventories,
  setProductTotals,
  inventory,
}: props) {
  const [newInventoryToCreate, setNewInventoryToCreate] = useState<
    Record<string, inventory_product_data[]>
  >({});
  const [totals, setTotals] = useState<Record<string, totals_sold>>({});
  const [totalsReduced, setTotalsReduced] = useState<totals_sold>();

  // effect to reduce the totals
  useEffect(() => {
    const values = Object.values(totals);
    if (values.length === 0) return;

    const reduced = Object.values(totals).reduce((before, now) => {
      return {
        total_purchase: before.total_purchase + now.total_purchase,
        total_sale: before.total_sale + now.total_sale,
        total_profit: before.total_profit + now.total_profit,
        total_seller_sale: before.total_seller_sale + now.total_seller_sale,
        total_seller_proft: before.total_seller_proft + now.total_seller_proft,
      };
    });

    setTotalsReduced(reduced);
  }, [totals]);

  // effect to save totals
  useEffect(() => {
    setProductTotals(totalsReduced);
  }, [setProductTotals, totalsReduced]);

  // effect to save the inventories
  useEffect(() => {
    setInventories(newInventoryToCreate);
  }, [newInventoryToCreate, setInventories]);

  return (
    <Container styles={{ marginBottom: "30px" }}>
      <Descriptions />
      {Object.entries(rawProducts).map((_, i) => {
        const data = _[1];
        const amounts = (inventory || [])
          .filter((el) => {
            const data = el.data();

            return data.product_ref.id === _[0];
          })
          .map((el) => el.data());

        const amountNotSold = amounts.reduce((before, now) => {
          return before + now.amount;
        }, 0);

        console.log("info product", data);

        return (
          <ProductClosing
            amountNotSold={amountNotSold}
            key={i}
            data={data}
            product_id={_[0]}
            setNewInventoryToCreate={setNewInventoryToCreate}
            setTotals={setTotals}
          />
        );
      })}
      {totalsReduced && (
        <ProductContainer $closing $hasInventory $withoutStock={1}>
          <Column gridColumn="9 / 10">Totales</Column>
          <Column
            gridColumn="10 / 11"
            title={numberParser(totalsReduced.total_purchase)}
          >
            {numberParser(totalsReduced.total_purchase)}
          </Column>
          <Column
            gridColumn="12 / 13"
            title={numberParser(totalsReduced.total_sale)}
          >
            {numberParser(totalsReduced.total_sale)}
          </Column>
          <Column
            gridColumn="13 / 14"
            title={numberParser(totalsReduced.total_profit)}
          >
            {numberParser(totalsReduced.total_profit)}
          </Column>
          <Column
            gridColumn="15 / 16"
            title={numberParser(totalsReduced.total_seller_sale)}
          >
            {numberParser(totalsReduced.total_seller_sale)}
          </Column>
          <Column
            gridColumn="16 / 17"
            title={numberParser(totalsReduced.total_seller_proft)}
          >
            {numberParser(totalsReduced.total_seller_proft)}
          </Column>
        </ProductContainer>
      )}
    </Container>
  );
}
