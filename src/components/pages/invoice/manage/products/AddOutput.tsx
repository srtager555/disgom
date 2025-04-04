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
import { isEqual } from "lodash";
import { getInvoiceByQuery } from "@/tools/invoices/getInvoiceByQuery";
import { restaOutputs } from "@/tools/products/restaOutputs";
import { sumaOutputs } from "@/tools/products/sumaOutputs";
import { updatePrice } from "@/tools/products/updatePrice";
import { someHumanChangesDetected } from "./Product";

type props = {
  outputs: DocumentSnapshot<outputType>[];
  currentAmount: number;
  currentStock: number;
  customPrice: number | undefined;
  productDoc: QueryDocumentSnapshot<productDoc>;
  setOutputsAmount: Dispatch<SetStateAction<number>>;
  setSomeHumanChangeDetected: Dispatch<
    SetStateAction<someHumanChangesDetected>
  >;
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

export const AddOutput = (props: Omit<props, "currentAmount" | "outputs">) => {
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
      customPrice={props.customPrice}
      setSomeHumanChangeDetected={props.setSomeHumanChangeDetected}
    />
  );
};

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.currentAmount != next.currentAmount) return false;
  if (!isEqual(prev.currentStock, next.currentStock)) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;

  return true;
});

type baseProps = Omit<props, "currentAmount" | "outputs">;

export function AddOutputBase({
  currentAmount,
  productDoc,
  currentStock,
  setOutputsAmount,
  customPrice,
  setSomeHumanChangeDetected,
}: baseProps & { currentAmount: number }) {
  const [amount, setAmount] = useState(currentAmount);
  const [lastCustomPrice, setLastCustomPrice] = useState(customPrice);
  const [humanAmountChanged, setHumanAmountChanged] = useState(false);
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

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice === lastCustomPrice) return;
    setHumanAmountChanged(true);
    setLastCustomPrice(customPrice);
  }, [customPrice, lastCustomPrice]);

  //effect to save the changes
  useEffect(() => {
    async function manage() {
      if (!humanAmountChanged) return;

      console.log("******** started to save outputs added");
      console.log("amount setted", cookedAmount);

      // Obtener la factura actual
      const invoice = await getInvoiceByQuery();
      if (!invoice) return;

      // Si solo cambia el precio (amount es igual y hay customPrice)
      if (cookedAmount === currentAmount && customPrice !== lastCustomPrice) {
        setLastCustomPrice(customPrice);
        await updatePrice(invoice, productDoc, cookedAmount, customPrice);
        setHumanAmountChanged(false);
        return;
      }

      // Comprobar si es una resta o suma
      if (cookedAmount < currentAmount) {
        // Lógica de resta
        console.log("Iniciando proceso de resta");
        await restaOutputs(
          invoice,
          productDoc,
          cookedAmount,
          currentAmount,
          customPrice
        );
      } else if (cookedAmount > currentAmount) {
        // Lógica de suma
        console.log("Iniciando proceso de suma");
        await sumaOutputs(
          invoice,
          productDoc,
          cookedAmount,
          currentAmount,
          customPrice
        );
      }
      setHumanAmountChanged(false);
    }

    manage();
  }, [
    cookedAmount,
    customPrice,
    productDoc,
    currentAmount,
    humanAmountChanged,
    lastCustomPrice,
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
            setSomeHumanChangeDetected((prev) => ({
              ...prev,
              addOutput: true,
            }));
          }}
        />
      </form>
    </Column>
  );
}
