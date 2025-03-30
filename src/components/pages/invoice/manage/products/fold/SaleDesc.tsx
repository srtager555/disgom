import { Column } from "../../../Product";
import { memo, useEffect, useState } from "react";
import { outputType } from "@/tools/products/addOutputs";
import { DocumentReference, getDoc } from "firebase/firestore";
import { isEqual } from "lodash";
import { ProductContainer } from "../../../ProductList";
import { numberParser } from "@/tools/numberPaser";
import { useGetInvoiceByQuery } from "@/hooks/invoice/getInvoiceByQuery";
import { productDoc } from "@/tools/products/create";

type props = {
  product_ref: DocumentReference<productDoc>;
};

type propsBase = {
  outputs: Array<outputType>;
};

export const SaleDescMemo = memo(SaleDesc, (prev, next) => {
  if (isEqual(prev.product_ref, next.product_ref)) return false;

  return true;
});

export function SaleDesc({ product_ref }: props) {
  const invoice = useGetInvoiceByQuery();
  const [outputs, setOutputs] = useState<Array<outputType>>([]);

  useEffect(() => {
    async function getOutputs() {
      const product_id = product_ref.id;
      const outputs_sold = invoice?.data()?.outputs_sold[product_id] || [];

      const outputs = outputs_sold.map(async (el) => {
        const output = (await getDoc(el)).data() as outputType;

        return output;
      });

      console.log("desc of outputs", outputs);

      setOutputs(await Promise.all(outputs));
    }

    getOutputs();

    return () => {
      setOutputs([]);
    };
  }, [product_ref, invoice]);

  return <SaleDescBaseMemo outputs={outputs} />;
}

const SaleDescBaseMemo = memo(SaleDescBase, (prev, next) => {
  if (!isEqual(prev.outputs, next.outputs)) return false;

  return true;
});

export function SaleDescBase({ outputs }: propsBase) {
  const [outputsByPrices, setOutputsByPrices] = useState<
    Record<number, Array<outputType>>
  >({});

  // effect to divide the outputs by purchase price
  useEffect(() => {
    const divition: Record<number, Array<outputType>> = {};

    outputs.forEach((el) => {
      divition[el.purchase_price] = [
        ...(divition[el.purchase_price] || []),
        el,
      ];
    });

    setOutputsByPrices(divition);
  }, [outputs]);

  return (
    <>
      <Header />
      {Object.values(outputsByPrices).map((el, i) => {
        function reducer(param: keyof outputType) {
          return el.reduce((acc, next) => {
            const value = next[param] as number;

            return acc + value;
          }, 0);
        }

        const total_amount = numberParser(reducer("amount"));
        const total_purchase_value = reducer("purchase_value");
        const total_sale_value = reducer("sale_value");
        const purchase_price = numberParser(el[0].purchase_price);
        const sale_price = numberParser(el[0].sale_price);

        return (
          <ProductContainer $children $hasInventory key={i} $withoutStock={1}>
            <Column gridColumn="7 / 8">{total_amount}</Column>
            <Column>{purchase_price}</Column>
            <Column title={numberParser(total_purchase_value)}>
              {numberParser(total_purchase_value)}
            </Column>
            <Column>{sale_price}</Column>
            <Column title={numberParser(total_sale_value)}>
              {numberParser(total_sale_value)}
            </Column>
            <Column
              title={numberParser(total_sale_value - total_purchase_value)}
            >
              {numberParser(total_sale_value - total_purchase_value)}
            </Column>
          </ProductContainer>
        );
      })}
    </>
  );
}

function Header() {
  return (
    <>
      <Column gridColumn="7 / 13">Descripción de la venta</Column>
      <Column gridColumn="7 / 8">Venta</Column>
      <Column>Costo</Column>
      <Column>Total C.</Column>
      <Column>Precio</Column>
      <Column>Total P.</Column>
      <Column>Utilidad</Column>
    </>
  );
}
