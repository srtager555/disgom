import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import {
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { stockType } from "@/tools/products/addToStock";
import { isEqual } from "lodash";
import { getInvoiceByQuery } from "@/tools/invoices/getInvoiceByQuery";
import { restaOutputs } from "@/tools/products/restaOutputs";

type props = {
  outputs: DocumentSnapshot<outputType>[];
  currentAmount: number;
  currentStock: number;
  customPrice: number | undefined;
  stock: stockType[] | [];
  humanAmountChanged: boolean;
  setHumanAmountChanged: Dispatch<SetStateAction<boolean>>;
  productDoc: QueryDocumentSnapshot<productDoc>;
  // rtProductData: productDoc;
  setOutputsAmount: Dispatch<SetStateAction<number>>;
};

export type variations = Array<{
  amount: number;
  purchase_price: number;
}>;

export type a = {
  sale_price: number;
  commission: number;
  purchase_price_variations: variations;
};

export type rawOutput = {
  product_ref: DocumentReference<productDoc>;
  entry_ref: DocumentReference<entryDoc>;
  amount: number;
  sale_price: number;
  purchase_price: number;
  commission: number;
};

export type product_outputs = {
  [key: string]: Array<DocumentReference<outputType>>;
};

export const AddOutput = (props: Omit<props, "currentAmount">) => {
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const currentAmount = useMemo(() => {
    return outputs.reduce((acc, now) => {
      const nowAmount = now.data()?.amount || 0;
      return acc + nowAmount;
    }, 0);
  }, [outputs]);

  return (
    <MemoAddOutput
      currentAmount={currentAmount}
      productDoc={props.productDoc}
      currentStock={props.currentStock}
      setOutputsAmount={props.setOutputsAmount}
      stock={props.stock}
      customPrice={props.customPrice}
      humanAmountChanged={props.humanAmountChanged}
      setHumanAmountChanged={props.setHumanAmountChanged}
    />
  );
};

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.currentAmount != next.currentAmount) return false;
  if (!isEqual(prev.currentStock, next.currentStock)) return false;
  if (!isEqual(prev.stock, next.stock)) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.humanAmountChanged !== next.humanAmountChanged) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;

  return true;
});

type baseProps = Omit<props, "currentAmount" | "outputs">;

export function AddOutputBase({
  currentAmount,
  productDoc,
  currentStock,
  setOutputsAmount,
  stock,
  customPrice,
  humanAmountChanged,
  setHumanAmountChanged,
}: baseProps & { currentAmount: number }) {
  const [amount, setAmount] = useState(currentAmount);
  const cookedAmount = useDebounce(amount) as number;
  const form_ref = useRef<HTMLFormElement>(null);

  // effect to refresh the amount when the currentAmount changes
  useEffect(() => {
    if (amount === currentAmount) return;

    setAmount(currentAmount);
  }, [currentAmount]);

  // effect to set the cooked amount to setOutputsAmount
  useEffect(() => {
    setOutputsAmount(cookedAmount);
  }, [cookedAmount, setOutputsAmount]);

  // effect to reset the input when changes of product
  useEffect(() => {
    form_ref.current?.reset();
  }, [productDoc.id]);

  //effect to save the changes
  useEffect(() => {
    async function manage() {
      if (!humanAmountChanged) return;

      console.log("******** started to save outputs added");
      console.log("amount setted", amount);

      // Obtener la factura actual
      const invoice = await getInvoiceByQuery();
      if (!invoice) return;

      // Comprobar si es una resta o suma
      if (amount < currentAmount) {
        // Lógica de resta
        console.log("Iniciando proceso de resta");
        await restaOutputs(invoice, productDoc, amount, currentAmount);
      } else if (amount > currentAmount) {
        // TODO: Implementar lógica de suma
        console.log("Lógica de suma pendiente de implementar");
      }
    }

    manage();
  }, [
    cookedAmount,
    customPrice,
    productDoc,
    stock,
    currentAmount,
    amount,
    humanAmountChanged,
  ]);

  return (
    <Column>
      <form ref={form_ref} onSubmit={(e) => e.preventDefault()}>
        <Input
          type="number"
          value={amount}
          min={0}
          max={currentStock + currentAmount}
          onChange={(e) => {
            const value = e.target.value;
            setAmount(Number(value));
            setHumanAmountChanged(true);
          }}
        />
      </form>
    </Column>
  );
}
