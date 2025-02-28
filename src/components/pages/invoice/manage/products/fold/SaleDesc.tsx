import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";
import { Column } from "../../../Product";
import { memo, useEffect, useState } from "react";
import { outputType } from "@/tools/products/addOutputs";
import { getDoc } from "firebase/firestore";
import { isEqual } from "lodash";
import { ProductContainer } from "../../../ProductList";

type props = {
  id: string;
};

type propsBase = {
  outputs: Array<outputType>;
};

export const SaleDescMemo = memo(SaleDesc, (prev, next) => {
  if (prev.id != next.id) return false;

  return true;
});

export function SaleDesc({ id }: props) {
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const [outputs, setOutputs] = useState<Array<outputType>>([]);

  useEffect(() => {
    async function getOutputs() {
      const data = invoice?.data();
      if (!data) return;

      const outputs_refs = data.products_outputs[id] || [];
      const outputs = await Promise.all(
        outputs_refs.map(async (el) => (await getDoc(el)).data() as outputType)
      );

      setOutputs(outputs);
    }

    getOutputs();
  }, [id, invoice]);

  return <SaleDescBaseMemo outputs={outputs} />;
}

const SaleDescBaseMemo = memo(SaleDescBase, (prev, next) => {
  if (!isEqual(prev.outputs, next.outputs)) return false;

  return true;
});

export function SaleDescBase({ outputs }: propsBase) {
  const [results, setResults] = useState<Record<number, Array<outputType>>>({});

  useEffect(() => {
    const divition: Record<number, Array<outputType>> = {};

    outputs.forEach((el) => {
      divition[el.purchase_price] = [
        ...(divition[el.purchase_price] || []),
        el,
      ];
    });

    setResults(divition);
  }, [outputs]);

  return (
    <>
      <Header />
      {Object.values(results).map((el, i) => {
        return (
          <ProductContainer $children $hasInventory key={i} $withoutStock={1}>
            <Column gridColumn="7 / 8">
              {el.reduce((acc, next) => {
                return acc + next.amount;
              }, 0)}
            </Column>
            <Column>{el[0].purchase_price}</Column>
            <Column>
              {el.reduce((acc, next) => {
                return acc + next.purchase_value;
              }, 0)}
            </Column>
            <Column>{el[0].sale_price}</Column>
            <Column>
              {el.reduce((acc, next) => {
                return acc + next.sale_value;
              }, 0)}
            </Column>
            <Column>
              {el.reduce((acc, next) => {
                return acc + (next.sale_value - next.purchase_value);
              }, 0)}
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
