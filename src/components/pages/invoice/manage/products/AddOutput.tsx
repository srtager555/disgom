import React, { useEffect, RefObject } from "react";
import { Column, Input } from "../../Product";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { someHumanChangesDetected } from "./Product";

type AddOutputBaseProps = {
  amountInput: string;
  setAmountInput: React.Dispatch<React.SetStateAction<string>>;
  currentStock: number;
  productDoc: DocumentSnapshot<productDoc>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
  setOverflowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  currentServerAmount: number;
};

export type variations = Array<{
  amount: number;
  purchase_price: number;
}>;

export type rawOutput = {
  product_ref: DocumentReference<productDoc>;
  entry_ref: DocumentReference<entryDoc>;
  amount: number;
  sale_price: number;
  purchase_price: number;
  commission: number;
  default_custom_price_ref: DocumentReference<defaultCustomPrice> | null;
};

export type product_outputs = {
  [key: string]: Array<DocumentReference<outputType>>;
};

export const AddOutput = (props: AddOutputBaseProps) => (
  <MemoAddOutput {...props} />
);

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.currentStock !== next.currentStock) return false;
  if (prev.amountInput !== next.amountInput) return false;
  if (prev.currentServerAmount !== next.currentServerAmount) return false;

  return true;
});

export function AddOutputBase({
  productDoc,
  currentStock,
  someHumanChangesDetected,
  setOverflowWarning,
  amountInput,
  setAmountInput,
  currentServerAmount,
}: AddOutputBaseProps) {
  // Effect to reset state when productDoc.id changes
  useEffect(() => {
    console.log(
      "AddOutput: Product changed to",
      productDoc.id,
      ". Resetting amount."
    );
    // Reset amountInput to server amount when product changes or server amount updates
    setAmountInput(String(currentServerAmount));
  }, [productDoc.id, currentServerAmount, setAmountInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("typing");

    // Only update the input state and notify the hook that user is typing.
    parseNumberInput(setAmountInput, e, { min: 0 });
  };

  const handleInputBlur = () => {
    // When the input loses focus, trigger the save logic.
    // This is where we mark the human interaction for saving.
    if (someHumanChangesDetected?.current) {
      someHumanChangesDetected.current.addOutput = true;
    }

    if (Number(amountInput) > currentStock) {
      setOverflowWarning(true);
      return;
    }
    setOverflowWarning(false); // Reset warning on blur
  };

  return (
    <Column>
      <Container className="show-print" styles={{ textAlign: "center" }}>
        {numberParser(Number(amountInput))}
      </Container>
      <Container className="hide-print">
        <Input
          value={amountInput} // Controlled component
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />
      </Container>
    </Column>
  );
}
