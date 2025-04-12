import React, { useEffect, useMemo, useRef, RefObject, useState } from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
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
  serverCurrentAmount: number;
  currentStock: number;
  customPrice: number | undefined;
  productDoc: DocumentSnapshot<productDoc>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
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

export const AddOutput = (
  props: Omit<props, "serverCurrentAmount" | "outputs">
) => {
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const serverCurrentAmount = useMemo(() => {
    return outputs.reduce((acc, now) => {
      const nowAmount = now.data()?.amount || 0;
      return acc + nowAmount;
    }, 0);
  }, [outputs]);

  return (
    <MemoAddOutput
      serverCurrentAmount={serverCurrentAmount}
      productDoc={props.productDoc}
      currentStock={props.currentStock}
      customPrice={props.customPrice}
      someHumanChangesDetected={props.someHumanChangesDetected}
    />
  );
};

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.serverCurrentAmount != next.serverCurrentAmount) return false;
  if (!isEqual(prev.currentStock, next.currentStock)) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (isEqual(prev.productDoc, next.productDoc)) return false;

  return true;
});

type baseProps = Omit<props, "outputs">;
type lastAmountToChange = {
  amount: number;
  customPrice: number | undefined;
};

export function AddOutputBase({
  serverCurrentAmount,
  productDoc,
  currentStock,
  customPrice,
  someHumanChangesDetected,
}: baseProps) {
  const [amount, setAmount] = useState(serverCurrentAmount);
  const [localCurrentAmount, setLocalCurrentAmount] =
    useState(serverCurrentAmount);
  const [localCurrentAmountHistory, setLocalCurrentAmountHistory] = useState<
    number[]
  >([]);
  const cookedAmount = useDebounce(amount) as number;
  const lastCustomPrice = useRef(customPrice);
  const humanAmountChanged = useRef(false);
  const form_ref = useRef<HTMLFormElement>(null);
  const [itsSavingNow, setItsSavingNow] = useState(false);
  const lastDataToChange = useRef<lastAmountToChange | null>(null);

  // effect to check if the serverCurrentAmount is in the localCurrentAmountHistory
  useEffect(() => {
    if (!localCurrentAmountHistory.includes(serverCurrentAmount)) {
      setLocalCurrentAmount(serverCurrentAmount);
    }
  }, [serverCurrentAmount]);

  // effect to refresh the amount when the localCurrentAmount changes
  useEffect(() => {
    if (amount === localCurrentAmount) return;

    setAmount(localCurrentAmount);
  }, [localCurrentAmount]);

  // effect to reset the input when changes of product
  useEffect(() => {
    form_ref.current?.reset();
  }, [productDoc.id]);

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice === lastCustomPrice.current) return;
    humanAmountChanged.current = true;
  }, [customPrice, lastCustomPrice]);

  //effect to save the changes
  useEffect(() => {
    async function manage() {
      let amountToWork: lastAmountToChange = {
        amount: cookedAmount,
        customPrice,
      };

      // check if has been changed by human and if there is an data in queue
      if (!humanAmountChanged.current && !lastDataToChange.current) return;
      setItsSavingNow(true);
      humanAmountChanged.current = false;

      // if the code is saving now, save the data to the queue
      if (itsSavingNow) {
        lastDataToChange.current = {
          amount: cookedAmount as number,
          customPrice,
        };
        console.log(
          "the code is saving now, the queue is",
          lastDataToChange.current
        );
        return;
      }

      // if there is an data in queue, get the data
      if (lastDataToChange.current) {
        amountToWork = lastDataToChange.current;
        lastDataToChange.current = null;
        console.log("there is a data in queue, getting the data", amountToWork);
      }

      console.log("******** started to save outputs added");
      console.log("amount setted", amountToWork.amount);

      // Obtener la factura actual
      const invoice = await getInvoiceByQuery();
      if (!invoice) return;

      // Si solo cambia el precio (amount es igual y hay customPrice)
      if (
        amountToWork.amount === localCurrentAmount &&
        amountToWork.customPrice !== lastCustomPrice.current
      ) {
        console.log("price change detected in add output");
        lastCustomPrice.current = customPrice;
        await updatePrice(
          invoice,
          productDoc,
          amountToWork.amount,
          amountToWork.customPrice
        );
        setItsSavingNow(false);

        return;
      }

      // Comprobar si es una resta o suma
      if (amountToWork.amount < localCurrentAmount) {
        // Lógica de resta
        console.log("Iniciando proceso de resta");
        await restaOutputs(
          invoice,
          productDoc,
          amountToWork.amount,
          localCurrentAmount,
          amountToWork.customPrice
        );
      } else if (amountToWork.amount > localCurrentAmount) {
        // Lógica de suma
        console.log("Iniciando proceso de suma");
        await sumaOutputs(
          invoice,
          productDoc,
          amountToWork.amount,
          localCurrentAmount,
          amountToWork.customPrice
        );
      }

      setLocalCurrentAmount(amountToWork.amount);
      setLocalCurrentAmountHistory([
        ...localCurrentAmountHistory,
        amountToWork.amount,
      ]);
      if (localCurrentAmountHistory.length > 10) {
        localCurrentAmountHistory.shift();
      }
      setItsSavingNow(false);
    }

    manage();
  }, [
    cookedAmount,
    customPrice,
    productDoc,
    localCurrentAmount,
    humanAmountChanged,
    lastCustomPrice,
    itsSavingNow,
  ]);

  return (
    <Column>
      <form ref={form_ref} onSubmit={(e) => e.preventDefault()}>
        <Input
          type="number"
          value={amount}
          min={0}
          max={currentStock + serverCurrentAmount}
          onChange={(e) => {
            const value = e.target.value;
            setAmount(Number(value));
            humanAmountChanged.current = true;
            someHumanChangesDetected.current.addOutput = true;
          }}
        />
      </form>
    </Column>
  );
}
