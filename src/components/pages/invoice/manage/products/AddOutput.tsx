import React, {
  useEffect,
  useMemo,
  useRef,
  RefObject,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { Column, Input } from "../../Product";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { isEqual } from "lodash";
import { getInvoiceByQuery } from "@/tools/invoices/getInvoiceByQuery";
import { restaOutputs } from "@/tools/products/restaOutputs";
import { sumaOutputs } from "@/tools/products/sumaOutputs";
import { updatePrice } from "@/tools/products/updatePrice";
import { someHumanChangesDetected } from "./Product";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { stockType } from "@/tools/products/addToStock";

type props = {
  outputs: DocumentSnapshot<outputType>[];
  setRawOutputs: Dispatch<SetStateAction<rawOutput[]>>;
  parentStock: stockType[];
  serverCurrentAmount: number;
  currentStock: number;
  customPrice: number | undefined;
  productDoc: DocumentSnapshot<productDoc>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
  setOverflowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  defaultCustomPrices: DocumentSnapshot<defaultCustomPrice> | undefined;
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

export const AddOutput = (props: Omit<props, "serverCurrentAmount">) => {
  const serverCurrentAmount = useMemo(() => {
    return props.outputs.reduce((acc, now) => {
      const nowAmount = now.data()?.amount || 0;
      return acc + nowAmount;
    }, 0);
  }, [props.outputs]);

  return <MemoAddOutput {...props} serverCurrentAmount={serverCurrentAmount} />;
};

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.serverCurrentAmount != next.serverCurrentAmount) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.currentStock !== next.currentStock) return false;

  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (isEqual(prev.productDoc, next.productDoc)) return false;

  return true;
});

export function AddOutputBase({
  outputs,
  serverCurrentAmount,
  productDoc,
  currentStock,
  customPrice,
  someHumanChangesDetected,
  setOverflowWarning,
  defaultCustomPrices,
  setRawOutputs,
  parentStock,
}: props) {
  const [amount, setAmount] = useState<string>(String(serverCurrentAmount)); // Input field's value
  const [localCurrentAmount, setLocalCurrentAmount] =
    useState(serverCurrentAmount); // Last known "saved" or "processed" amount
  const [localCurrentAmountHistory, setLocalCurrentAmountHistory] = useState<
    number[]
  >([serverCurrentAmount]);

  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastCustomPriceRef = useRef(customPrice); // Tracks the last successfully processed customPrice
  const humanInteractionDetectedRef = useRef(false); // User typed or relevant prop changed
  const isCurrentlySavingRef = useRef(false); // Prevents re-entrant saves

  // Effect to sync with serverCurrentAmount if it changes externally and is not a recent local save
  useEffect(() => {
    if (!localCurrentAmountHistory.includes(serverCurrentAmount)) {
      console.log(
        "AddOutput: serverCurrentAmount changed externally to",
        serverCurrentAmount,
        "not in history",
        localCurrentAmountHistory,
        ". Syncing."
      );
      setLocalCurrentAmount(serverCurrentAmount);
      setAmount(String(serverCurrentAmount)); // Also update input field
      humanInteractionDetectedRef.current = false; // This was not a local human interaction
    }
  }, [serverCurrentAmount]);

  // Effect to refresh the input field if localCurrentAmount changes (e.g., after a save)
  // and the user hasn't made newer changes.
  useEffect(() => {
    if (
      Number(amount) !== localCurrentAmount &&
      !humanInteractionDetectedRef.current
    ) {
      console.log(
        "AddOutput: localCurrentAmount changed to",
        localCurrentAmount,
        ". Syncing input field."
      );
      setAmount(String(localCurrentAmount));
    }
  }, [localCurrentAmount, amount]); // Removed humanInteractionDetectedRef from deps to avoid potential loop, logic relies on its current value

  // Effect to reset state when productDoc.id changes
  useEffect(() => {
    console.log(
      "AddOutput: Product changed to",
      productDoc.id,
      ". Resetting state.",
      customPrice
    );
    setAmount(String(serverCurrentAmount));
    setLocalCurrentAmount(serverCurrentAmount);
    setLocalCurrentAmountHistory([serverCurrentAmount]);
    lastCustomPriceRef.current = customPrice;
    humanInteractionDetectedRef.current = false;
    isCurrentlySavingRef.current = false;
  }, [productDoc.id]);

  // The core saving logic
  const saveChangesLogic = useCallback(
    async (amountToSave: number, priceToSave: number | undefined) => {
      setOverflowWarning(false);
      if (isCurrentlySavingRef.current) {
        console.log("AddOutput: Save already in progress. Ignoring this call.");
        return;
      }

      if (
        amountToSave === localCurrentAmount &&
        priceToSave === lastCustomPriceRef.current
      ) {
        console.log("AddOutput: No change in amount or price. Skipping save.");
        humanInteractionDetectedRef.current = false;
        return;
      }

      isCurrentlySavingRef.current = true;
      console.log("AddOutput: -------- Debounced save triggered --------");
      console.log(
        "AddOutput: Amount to save:",
        amountToSave,
        "(Local current:",
        localCurrentAmount,
        ")"
      );
      console.log(
        "AddOutput: Price to save:",
        priceToSave,
        "(Last custom price:",
        lastCustomPriceRef.current,
        ")"
      );

      const invoice = await getInvoiceByQuery();
      if (!invoice) {
        console.error("AddOutput: Invoice not found, aborting save.");
        isCurrentlySavingRef.current = false;
        return;
      }

      let success = false;
      try {
        if (
          amountToSave === localCurrentAmount &&
          priceToSave !== lastCustomPriceRef.current
        ) {
          console.log("AddOutput: Price change detected.");

          await updatePrice(
            invoice,
            productDoc,
            defaultCustomPrices,
            outputs,
            amountToSave,
            parentStock,
            setRawOutputs,
            priceToSave
          );
          success = true;
        } else if (amountToSave < localCurrentAmount) {
          console.log("AddOutput: Resta (decrease) detected.");
          await restaOutputs(
            invoice,
            productDoc,
            outputs,
            defaultCustomPrices,
            amountToSave,
            localCurrentAmount,
            parentStock,
            setRawOutputs,
            priceToSave
          );
          success = true;
        } else if (amountToSave > localCurrentAmount) {
          if (currentStock < amountToSave - localCurrentAmount) {
            console.log(
              "Addoutput: Suma (Increase) Not enough stock. Skipping save and showing warning.",
              currentStock,
              "<",
              amountToSave,
              "."
            );
            humanInteractionDetectedRef.current = false;
            setOverflowWarning(true);
            return;
          }

          console.log("AddOutput: Suma (increase) detected.");
          await sumaOutputs(
            invoice,
            productDoc,
            amountToSave,
            localCurrentAmount,
            defaultCustomPrices,
            parentStock,
            setRawOutputs,
            priceToSave
          );
          success = true;
        }

        if (success) {
          console.log("AddOutput: Save operation successful.");
          setLocalCurrentAmount(amountToSave);
          setLocalCurrentAmountHistory((prev) =>
            [...prev, amountToSave].slice(-10)
          );
          lastCustomPriceRef.current = priceToSave;
          humanInteractionDetectedRef.current = false;
        } else {
          console.log(
            "AddOutput: Save operation did not result in a change or was skipped."
          );
          if (
            amountToSave === localCurrentAmount &&
            priceToSave === lastCustomPriceRef.current
          ) {
            humanInteractionDetectedRef.current = false;
          }
        }
      } catch (error) {
        console.error("AddOutput: Error during save operation:", error);
      } finally {
        isCurrentlySavingRef.current = false;
        console.log("AddOutput: -------- Debounced save finished --------");
      }
    },
    [
      setOverflowWarning,
      localCurrentAmount,
      currentStock,
      productDoc,
      defaultCustomPrices,
      outputs,
    ]
  );

  // Effect to detect if the customPrice prop has changed from what we last processed.
  useEffect(() => {
    console.log(
      "customPrice detected",
      customPrice,
      lastCustomPriceRef.current
    );
    if (customPrice !== lastCustomPriceRef.current) {
      console.log(
        "AddOutput: customPrice prop changed from",
        lastCustomPriceRef.current,
        "to",
        customPrice,
        ". Marking for potential save."
      );
      humanInteractionDetectedRef.current = true;
    }
  }, [customPrice]);

  // Effect to trigger debounced save on amount (from input) or customPrice (from prop) change
  useEffect(() => {
    const amountParsedToNumber = Number(amount);

    if (isNaN(amountParsedToNumber)) {
      console.log("Invalid amount detected, maybe is a decimal number?");
      return;
    }

    if (humanInteractionDetectedRef.current) {
      console.log(
        `AddOutput: Interaction detected. Scheduling save with amount: ${amount}, customPrice: ${customPrice}`
      );
      checkHasNextInvoice(
        () => saveChangesLogic(amountParsedToNumber, customPrice),
        humanInteractionDetectedRef.current,
        productDoc.id
      );
    }
  }, [amount, customPrice, saveChangesLogic]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseNumberInput(setAmount, e, { min: 0 });

    humanInteractionDetectedRef.current = true;
    if (someHumanChangesDetected?.current) {
      someHumanChangesDetected.current.addOutput = true;
    }
  };

  return (
    <Column>
      <Container className="show-print" styles={{ textAlign: "center" }}>
        {numberParser(Number(amount))}
      </Container>
      <Container className="hide-print">
        <Input
          value={amount} // Controlled component
          onChange={handleInputChange}
        />
      </Container>
    </Column>
  );
}
