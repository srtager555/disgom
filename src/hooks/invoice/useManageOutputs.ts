import { useEffect, useState, useRef } from "react";
import { DocumentSnapshot, getFirestore } from "firebase/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { productDoc } from "@/tools/products/create";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { stockType } from "@/tools/products/addToStock";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { getAuth } from "firebase/auth";
import { restaOutputs } from "@/tools/products/restaOutputs"; // Assuming restaOutputs is now direct
import { sumaOutputs } from "@/tools/products/sumaOutputs"; // Assuming sumaOutputs is now direct
import { useProductOutputs } from "@/contexts/ProductOutputsContext";
import { someHumanChangesDetected } from "@/components/pages/invoice/manage/products/Product";

interface UseManageOutputsProps {
  invoice: DocumentSnapshot<invoiceType> | undefined;
  productDoc: DocumentSnapshot<productDoc>;
  defaultCustomPrices: DocumentSnapshot<defaultCustomPrice> | undefined;
  parentStock: stockType[];
  amountInput: string; // Raw input value from AddOutput
  customPriceInput: number | undefined; // Raw input value from Price
  humanInteractionDetectedRef: React.MutableRefObject<someHumanChangesDetected>;
}

export function useManageOutputs({
  invoice,
  productDoc,
  defaultCustomPrices,
  parentStock,
  amountInput,
  customPriceInput,
  humanInteractionDetectedRef,
}: UseManageOutputsProps) {
  const { outputs: serverOutputsSnapshots } = useProductOutputs(); // Outputs from Firestore
  const [rawOutputs, setRawOutputs] = useState<rawOutput[]>([]);
  const [currentOutputsServerAmount, setCurrentOutputsServerAmount] =
    useState(0);
  const lastProcessedAmount = useRef(0); // To track the amount that was last saved/synced
  const lastProcessedPrice = useRef<number | undefined>(undefined); // To track the price that was last saved/synced
  const firstTimeLoad = useRef(true);

  const currentUid = getAuth(getFirestore().app).currentUser?.uid;

  // Effect to sync rawOutputs and currentOutputsServerAmount from Firestore
  useEffect(() => {
    // check if all outputs are maded by the same user
    const isTheSameUser = serverOutputsSnapshots.some((output) => {
      return output.data()?.uid === currentUid;
    });

    if (isTheSameUser && !firstTimeLoad) return;

    if (!serverOutputsSnapshots || serverOutputsSnapshots.length === 0) {
      setRawOutputs([]);
      setCurrentOutputsServerAmount(0);
      lastProcessedAmount.current = 0;
      lastProcessedPrice.current = undefined;
      return;
    }

    const newRawOutputs: rawOutput[] = [];
    let totalAmount = 0;
    let latestPrice: number | undefined = undefined;

    serverOutputsSnapshots.forEach((outputSnap) => {
      const data = outputSnap.data();
      if (data) {
        newRawOutputs.push({
          product_ref: data.product_ref,
          entry_ref: data.entry_ref,
          amount: data.amount,
          sale_price: data.sale_price,
          purchase_price: data.purchase_price,
          commission: data.commission,
          default_custom_price_ref: data.default_custom_price_ref,
        });
        totalAmount += data.amount;
        // Assuming the first output's sale_price is representative for the current price
        if (latestPrice === undefined) {
          latestPrice = data.sale_price;
        }
      }
    });

    // Only update if the change is NOT from the current user
    // This is a heuristic: if the total amount or price from server differs from what we last processed locally,
    // AND it wasn't a human interaction that just triggered a save, then it's an external change.
    if (
      (!humanInteractionDetectedRef.current.addOutput &&
        (totalAmount !== lastProcessedAmount.current ||
          latestPrice !== lastProcessedPrice.current)) ||
      (humanInteractionDetectedRef.current.addOutput &&
        totalAmount === lastProcessedAmount.current &&
        latestPrice === lastProcessedPrice.current) // If human interaction but no actual change, reset flag
    ) {
      setRawOutputs(newRawOutputs);
      setCurrentOutputsServerAmount(totalAmount);
      lastProcessedAmount.current = totalAmount;
      lastProcessedPrice.current = latestPrice;
      humanInteractionDetectedRef.current.addOutput = false; // Reset flag after processing external change
    }
  }, [serverOutputsSnapshots, currentUid, humanInteractionDetectedRef]);

  // Effect to keep the server amount in sync with the local rawOutputs
  useEffect(() => {
    const newTotalAmount = rawOutputs.reduce((acc, o) => acc + o.amount, 0);
    if (newTotalAmount !== currentOutputsServerAmount) {
      setCurrentOutputsServerAmount(newTotalAmount);
    }
    // This effect should only run when rawOutputs changes to avoid loops,
    // as it's responsible for updating a state that might trigger other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawOutputs]);

  // Effect to trigger save logic when amountInput or customPriceInput changes due to human interaction
  useEffect(() => {
    if (!invoice || !currentUid) return;

    const amountToSave = Number(amountInput);
    const priceToSave = customPriceInput;

    // Only trigger save if human interaction is detected AND there's an actual change
    console.log(
      `conditional AddOutputs: ${
        humanInteractionDetectedRef.current.addOutput
          ? "Human detected"
          : "Human NO detected"
      } ${
        amountToSave === currentOutputsServerAmount
          ? "NO CHANGE"
          : `local (${amountToSave}) and server (${currentOutputsServerAmount})`
      }`
    );

    if (!humanInteractionDetectedRef.current.addOutput) {
      return;
    }

    if (amountToSave !== currentOutputsServerAmount) {
      if (amountToSave < currentOutputsServerAmount) {
        console.log("restando outputs...");

        restaOutputs(
          invoice,
          productDoc,
          serverOutputsSnapshots, // Pass the actual DocumentSnapshots
          defaultCustomPrices,
          amountToSave,
          currentOutputsServerAmount,
          parentStock,
          setRawOutputs, // Pass setRawOutputs to update UI immediately
          priceToSave
        ); // Increase amount
      } else if (amountToSave > currentOutputsServerAmount) {
        console.log("Increasing outputs...");

        sumaOutputs(
          invoice,
          productDoc,
          amountToSave,
          currentOutputsServerAmount,
          defaultCustomPrices,
          parentStock,
          setRawOutputs, // Pass setRawOutputs to update UI immediately
          humanInteractionDetectedRef,
          priceToSave
        );
      }
    }

    // After triggering save, update last processed values and reset human interaction flag
    lastProcessedAmount.current = amountToSave;
    humanInteractionDetectedRef.current.addOutput = false;
    humanInteractionDetectedRef.current.outputsSolds = true;
  }, [
    amountInput,
    // customPriceInput,
    invoice,
    productDoc,
    serverOutputsSnapshots,
    defaultCustomPrices,
    parentStock,
    currentOutputsServerAmount,
    currentUid,
    humanInteractionDetectedRef,
  ]);

  return { rawOutputs, currentOutputsServerAmount, setRawOutputs };
}
