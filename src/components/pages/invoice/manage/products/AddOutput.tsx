import React, {
  useEffect,
  RefObject,
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
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
  devoInput: string;
  invAmount: number;
  currentStock: number;
  productDoc: DocumentSnapshot<productDoc>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
  setOverflowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  currentServerAmount: number;
  runOnBlurEventAgain: boolean;
  setRunOnBlurEventAgain: Dispatch<SetStateAction<boolean>>;
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
  if (prev.devoInput !== next.devoInput) return false;
  if (prev.invAmount !== next.invAmount) return false;

  return true;
});

export function AddOutputBase({
  productDoc,
  currentStock,
  someHumanChangesDetected,
  setOverflowWarning,
  amountInput,
  setAmountInput,
  devoInput,
  invAmount,
  currentServerAmount,
  runOnBlurEventAgain,
  setRunOnBlurEventAgain,
}: AddOutputBaseProps) {
  const [localInputAmount, setLocalInputAmount] = useState("0");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("typing");

    // Only update the input state and notify the hook that user is typing.
    parseNumberInput(setLocalInputAmount, e, { min: 0 });
  };

  const handleInputBlur = useCallback(() => {
    const localInput = Number(localInputAmount);
    const diff = Number(localInputAmount) - Number(amountInput);
    const overflow = diff > currentStock;
    const totalAmount = localInput + invAmount;

    const totalAmountIsMoreOrEqualThanDevoAmount =
      totalAmount >= Number(devoInput);

    console.log(
      "Add blur triggered",
      diff,
      currentStock,
      overflow,
      devoInput,
      totalAmountIsMoreOrEqualThanDevoAmount,
      totalAmount
    );

    if (overflow || !totalAmountIsMoreOrEqualThanDevoAmount) {
      setOverflowWarning(true);
      if (someHumanChangesDetected?.current) {
        someHumanChangesDetected.current.addOutput = false;
      }

      setLocalInputAmount(amountInput);

      return;
    } else {
      // When the input loses focus, trigger the save logic.
      // This is where we mark the human interaction for saving.
      if (someHumanChangesDetected?.current) {
        someHumanChangesDetected.current.addOutput = true;
      } else {
        console.error("someHumanChangesDetected is undefined");
        console.error("Running the function again in 1000ms");

        setTimeout(() => {
          handleInputBlur();
        }, 1000);

        return;
      }

      setAmountInput(localInputAmount);
      setOverflowWarning(false); // Reset warning on blur
    }
  }, [
    amountInput,
    currentStock,
    localInputAmount,
    setAmountInput,
    setOverflowWarning,
    someHumanChangesDetected,
  ]);

  // Effect to verify if the amount reached the save function correctly
  useEffect(() => {
    if (!runOnBlurEventAgain) return;

    handleInputBlur();

    setRunOnBlurEventAgain(false);
  }, [handleInputBlur, runOnBlurEventAgain, setRunOnBlurEventAgain]);

  // Effect to reset state when productDoc.id changes
  useEffect(() => {
    console.log(
      "AddOutput: Product changed to",
      productDoc.id,
      ". Resetting amount."
    );
    // Reset amountInput to server amount when product changes or server amount updates
    setAmountInput(String(currentServerAmount));
    setLocalInputAmount(String(currentServerAmount));
  }, [productDoc.id, currentServerAmount, setAmountInput]);

  return (
    <Column>
      <Container className="show-print" styles={{ textAlign: "center" }}>
        {numberParser(Number(localInputAmount))}
      </Container>
      <Container className="hide-print">
        <Input
          value={localInputAmount} // Controlled component
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />
      </Container>
    </Column>
  );
}
