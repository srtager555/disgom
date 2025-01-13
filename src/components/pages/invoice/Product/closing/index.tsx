import { Container } from "@/styles/index.styles";
import { Column, Input } from "..";
import { ProductContainer } from "../../ProductList";
import { rawProductWithInventory } from "@/pages/invoices/closing";
import { useMemo } from "react";

type props = {
  data: rawProductWithInventory;
  product_id: string;
};

export function ProductClosing({ product_id, data }: props) {
  const inventoryAmount = useMemo(() => {
    if (data.inventory.length === 0) return 0;

    return data.inventory.reduce((before, now) => {
      return before + now.amount;
    }, 0);
  }, [data.inventory]);

  const load = useMemo(() => {
    if (data.purchases_amounts.length === 0) return 0;

    return data.purchases_amounts.reduce((before, now) => {
      return before + now.amount;
    }, 0);
  }, [data.purchases_amounts]);

  return (
    <ProductContainer $header $withoutStock={1} $hasInventory $closing>
      <Column gridColumn="1 / 4">Nombre del producto</Column>
      <Column gridColumn="">{inventoryAmount}</Column>
      <Column gridColumn="">{load}</Column>
      <Column gridColumn="">{inventoryAmount + load}</Column>
      <Column gridColumn="">
        <Input />
      </Column>
      <Column gridColumn="">P Costo</Column>
      <Column gridColumn="">T Costo</Column>
      <Column gridColumn="">Precio</Column>
      <Column gridColumn="">Total</Column>
      <Column gridColumn="">Ganan</Column>

      <Column gridColumn="">P Vend</Column>
      <Column gridColumn="">V Vend</Column>
      <Column gridColumn="">G Vend</Column>

      <Column gridColumn="">Extra</Column>
    </ProductContainer>
  );
}
