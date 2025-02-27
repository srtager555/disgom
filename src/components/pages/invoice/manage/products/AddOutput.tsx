import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import { DocumentReference, QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { stockType } from "@/tools/products/addToStock";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import { useGetInvoiceByQuery } from "@/hooks/invoice/getInvoiceByQuery";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";

type props = {
  currentAmount: number;
  currentStock: number;
  stocks: stockType[];
  productDoc: QueryDocumentSnapshot<productDoc>;
  // rtProductData: productDoc;
  setOutputsAmount: Dispatch<SetStateAction<number>>;
  customPrice: number | undefined;
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
  const output = useGetProductOutputByID(props.productDoc.id);
  const currentAmount = useMemo(() => {
    return output.reduce((acc, now) => {
      const nowAmount = now.data()?.amount || 0;
      return acc + nowAmount;
    }, 0);
  }, [output]);

  return <MemoAddOutput currentAmount={currentAmount} {...props} />;
};

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.currentAmount != next.currentAmount) return false;
  if (prev.customPrice != next.customPrice) return false;

  const prevProductDocID = prev.productDoc.id;
  const nextProductDocID = next.productDoc.id;

  return prevProductDocID === nextProductDocID;
});

export function AddOutputBase({
  currentAmount,
  productDoc,
  // rtProductData,
  currentStock,
  stocks,
  setOutputsAmount,
  customPrice,
}: props) {
  const [cookingAmountAdded, setCookingAmountAdded] =
    useState<number>(currentAmount);
  const cookedAmountAdded = useDebounce(cookingAmountAdded);
  const [outputsToCreate, setOutputsToCreate] = useState<Array<rawOutput>>([]);
  const [lastCustomPrice, setLastCustomPrice] = useState<number | undefined>(
    undefined
  );
  const [firstPain, setFirstPain] = useState(true);
  const invoice = useGetInvoiceByQuery();
  const form_ref = useRef<HTMLFormElement>(null);

  const amountListener = useCallback(
    function (n: number) {
      let remainingAmount = n;

      setOutputsToCreate([]);
      if (remainingAmount <= 0) return;
      if (!stocks) return;

      for (let index = 0; index < stocks.length; index++) {
        const stock = stocks[index];

        const remaining = remainingAmount - stock.amount;

        if (remaining > 0) {
          remainingAmount = remaining;
          setOutputsToCreate((props) => [
            ...props,
            {
              amount: stock.amount,
              product_ref: productDoc.ref,
              entry_ref: stock.entry_ref,
              sale_price: customPrice || stock.sale_price,
              purchase_price: stock.purchase_price,
              commission: stock.seller_commission,
            },
          ]);
        } else {
          setOutputsToCreate((props) => [
            ...props,
            {
              amount: remainingAmount,
              product_ref: productDoc.ref,
              entry_ref: stock.entry_ref,
              sale_price: customPrice || stock.sale_price,
              purchase_price: stock.purchase_price,
              commission: stock.seller_commission,
            },
          ]);
          break;
        }
      }
    },
    [stocks, customPrice]
  );

  // effect to reset the input when changes of product
  useEffect(() => {
    form_ref.current?.reset();
  }, [productDoc.id]);

  // effect to create the new raw outputs
  useEffect(() => {
    if ((cookedAmountAdded as number) >= 0)
      amountListener(cookedAmountAdded as number);
  }, [amountListener, cookedAmountAdded, customPrice]);

  // effect to add the outputs
  useEffect(() => {
    if (!invoice) return;
    if (currentAmount === cookedAmountAdded && customPrice === lastCustomPrice)
      return;
    if (firstPain && outputsToCreate.length === 0) return;

    if (firstPain) setFirstPain(false);
    setLastCustomPrice(customPrice);

    console.log("!");
    addOutputs(invoice, productDoc, outputsToCreate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.ref?.id, outputsToCreate]);

  // useEffect to set the outputs amounts
  useEffect(() => {
    if (outputsToCreate.length > 0) {
      const outputsAmount = outputsToCreate.reduce(
        (acc, next) => acc + next.amount,
        0
      );
      setOutputsAmount(outputsAmount);
    } else {
      setOutputsAmount(currentAmount);
    }
  }, [currentAmount, outputsToCreate, setOutputsAmount]);

  return (
    <Column>
      <form ref={form_ref} onSubmit={(e) => e.preventDefault()}>
        <Input
          type="number"
          defaultValue={currentAmount}
          min={0}
          max={currentStock + currentAmount}
          onChange={(e) => {
            const value = e.target.value;
            setCookingAmountAdded(Number(value));
          }}
        />
      </form>
    </Column>
  );
}
