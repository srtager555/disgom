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
import { DocumentReference, QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { ManageProductOutputsSaves } from "@/tools/products/ManageSaves";
import { stockType } from "@/tools/products/addToStock";
import { isEqual } from "lodash";

type props = {
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
  if (!isEqual(prev.currentStock, next.currentStock)) return false;
  if (!isEqual(prev.stock, next.stock)) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.humanAmountChanged !== next.humanAmountChanged) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;

  return true;
});

export function AddOutputBase({
  currentAmount,
  productDoc,
  currentStock,
  setOutputsAmount,
  stock,
  customPrice,
  humanAmountChanged,
  setHumanAmountChanged,
}: props) {
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
      console.log("amount", amount);
      console.log(humanAmountChanged);

      if (!humanAmountChanged) return;

      console.log("saving");

      await ManageProductOutputsSaves({
        productDoc,
        customPrice: customPrice,
        stocks: stock,
        outputs_amount_added: cookedAmount,
      });
    }

    manage();
  }, [cookedAmount, customPrice, productDoc, stock]);

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
