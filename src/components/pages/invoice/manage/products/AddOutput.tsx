import React, {
  useEffect,
  useRef,
  RefObject,
  useState,
  useCallback,
} from "react";
import { Column, Input } from "../../Product";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { isEqual } from "lodash";
import { restaOutputs } from "@/tools/products/restaOutputs";
import { sumaOutputs } from "@/tools/products/sumaOutputs";
import { someHumanChangesDetected } from "./Product";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { stockType } from "@/tools/products/addToStock";
import { useManageServerAmount } from "@/hooks/invoice/useManageServerAmount";
import { useInvoice } from "@/contexts/InvoiceContext";

type AddOutputBaseProps = {
  setRawOutputs: React.Dispatch<React.SetStateAction<rawOutput[]>>;
  rawOutputs: rawOutput[];
  parentStock: stockType[];
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

function outputDocToRawOutput(
  outputDoc: DocumentSnapshot<outputType>
): rawOutput {
  const data = outputDoc.data();
  if (!data) {
    // This should not happen if the document exists, but it's good practice to handle it.
    throw new Error(`Output document ${outputDoc.id} has no data.`);
  }
  return {
    product_ref: data.product_ref,
    entry_ref: data.entry_ref,
    amount: data.amount,
    sale_price: data.sale_price,
    purchase_price: data.purchase_price,
    commission: data.commission,
    default_custom_price_ref: data.default_custom_price_ref,
  };
}

export const AddOutput = (props: AddOutputBaseProps) => (
  <MemoAddOutput {...props} />
);

export const MemoAddOutput = React.memo(AddOutputBase, (prev, next) => {
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.currentStock !== next.currentStock) return false;
  if (!isEqual(prev.rawOutputs, next.rawOutputs)) return false;

  return true;
});

export function AddOutputBase({
  productDoc,
  currentStock,
  customPrice,
  someHumanChangesDetected,
  setOverflowWarning,
  defaultCustomPrices,
  setRawOutputs,
  rawOutputs,
  parentStock,
}: AddOutputBaseProps) {
  const [amountInput, setAmountInput] = useState<string>("0");
  const { invoice } = useInvoice();
  const {
    currentServerAmount,
    notifyIsWritting,
    rawOutputsFromServer: outputsFromServer,
  } = useManageServerAmount(setAmountInput, productDoc.id);

  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastDebouncedOperationToCancel = useRef<() => void>(() => {});
  const lastCustomPriceRef = useRef(customPrice); // Tracks the last successfully processed customPrice
  const humanInteractionDetectedRef = useRef(false); // User typed or relevant prop changed
  const isCurrentlySavingRef = useRef(false); // Prevents re-entrant saves

  // Efecto para inicializar y sincronizar el estado `rawOutputs` del componente padre.
  useEffect(() => {
    // Convierte los outputs del servidor (formato DocumentSnapshot<outputType>) al formato rawOutput[].
    const newRawOutputs = outputsFromServer.map(outputDocToRawOutput);

    // Compara con el estado actual para evitar re-renderizados innecesarios.
    // Si no son iguales, actualiza el estado en el componente padre (`Product.tsx`).
    if (!isEqual(newRawOutputs, rawOutputs)) {
      setRawOutputs(newRawOutputs);
    }
  }, [outputsFromServer, setRawOutputs, rawOutputs]);

  // Effect to reset state when productDoc.id changes
  useEffect(() => {
    console.log(
      "AddOutput: Product changed to",
      productDoc.id,
      ". Resetting interaction flags."
    );
    // El input 'amountInput' será reseteado por useManageServerAmount llamando a setAmountInput
    lastCustomPriceRef.current = customPrice;
    humanInteractionDetectedRef.current = false;
    isCurrentlySavingRef.current = false;
  }, [productDoc.id, customPrice]);

  // The core saving logic
  const saveChangesLogic = useCallback(
    async (amountToSave: number, priceToSave: number | undefined) => {
      setOverflowWarning(false);
      if (isCurrentlySavingRef.current) {
        console.log("AddOutput: Save already in progress. Ignoring this call.");
        return;
      }

      if (
        amountToSave === currentServerAmount && // Usar valor del hook
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
        "(Server current:",
        currentServerAmount, // Usar valor del hook
        ")"
      );
      console.log(
        "AddOutput: Price to save:",
        priceToSave,
        "(Last custom price:",
        lastCustomPriceRef.current,
        ")"
      );

      if (!invoice) {
        console.error("AddOutput: Invoice not found, aborting save.");
        isCurrentlySavingRef.current = false;
        return;
      }

      let success = false;
      try {
        lastDebouncedOperationToCancel.current();

        if (amountToSave < currentServerAmount) {
          // Usar valor del hook
          console.log("AddOutput: Resta (decrease) detected.");
          lastDebouncedOperationToCancel.current = restaOutputs(
            invoice,
            productDoc,
            outputsFromServer, // Usar valor del hook
            defaultCustomPrices,
            amountToSave,
            currentServerAmount, // Usar valor del hook
            parentStock,
            setRawOutputs,
            priceToSave
          );
          success = true;
        } else if (amountToSave > currentServerAmount) {
          // Usar valor del hook
          if (currentStock < amountToSave - currentServerAmount) {
            // Usar valor del hook
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
          lastDebouncedOperationToCancel.current = sumaOutputs(
            invoice,
            productDoc,
            amountToSave,
            currentServerAmount, // Usar valor del hook
            defaultCustomPrices,
            parentStock,
            setRawOutputs,
            priceToSave
          );
          success = true;
        }

        if (success) {
          console.log("AddOutput: Save operation successful.");
          // El hook se encargará de actualizar el serverCurrentAmount y el input si es necesario
          lastCustomPriceRef.current = priceToSave;
          humanInteractionDetectedRef.current = false;
        } else {
          console.log(
            "AddOutput: Save operation did not result in a change or was skipped."
          );
        }
      } catch (error) {
        console.error("AddOutput: Error during save operation:", error);
      } finally {
        isCurrentlySavingRef.current = false;
        console.log(
          "AddOutput: -------- Debounced save finished | saving in process --------"
        );
      }
    },
    [
      setOverflowWarning,
      currentServerAmount, // Usar valor del hook
      invoice, // Add invoice to dependencies
      currentStock,
      productDoc,
      defaultCustomPrices,
      outputsFromServer, // Usar valor del hook
      parentStock, // setRawOutputs is no longer passed to save functions
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

  // No longer trigger save on every amountInput change.
  // Save will be triggered onBlur or when customPrice changes.
  // The useEffect below handles customPrice changes.

  // Effect to trigger debounced save when customPrice changes
  // or when a human interaction (onBlur) has occurred.
  useEffect(() => {
    // If customPrice has changed, it's a human-initiated change (or external prop change)
    // that should trigger a save.
    if (customPrice !== lastCustomPriceRef.current) {
      // This condition is already handled by the customPrice useEffect above,
      // which sets humanInteractionDetectedRef.current = true.
      // So, we just need to ensure saveChangesLogic is called.
      // The checkHasNextInvoice will debounce it.
      if (humanInteractionDetectedRef.current) {
        // Only if a human change was detected
        console.log(
          `AddOutput: Custom price change detected. Scheduling save with amount: ${amountInput}, customPrice: ${customPrice}`
        );
        checkHasNextInvoice(
          () => saveChangesLogic(Number(amountInput), customPrice),
          true, // Always treat price changes as human-initiated for save trigger
          productDoc.id
        );
      }
    } else if (humanInteractionDetectedRef.current) {
      // This branch handles the case where humanInteractionDetectedRef.current is true
      // but customPrice hasn't changed (meaning it was an amount input change).
      // This will be triggered by the onBlur handler.
      // This useEffect will now primarily react to customPrice changes that set the flag.
      // The onBlur handler will directly call checkHasNextInvoice.
    }
  }, [
    amountInput,
    customPrice,
    saveChangesLogic,
    checkHasNextInvoice,
    productDoc.id,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update the input state and notify the hook that user is typing.
    parseNumberInput(setAmountInput, e, { min: 0 });
    notifyIsWritting(); // Notificar al hook que el input está siendo utilizado.
    humanInteractionDetectedRef.current = true;
    // Do NOT set humanInteractionDetectedRef.current = true here.
    // Do NOT set someHumanChangesDetected.current.addOutput = true here.
    // These flags will be set onBlur.
  };

  const handleInputBlur = () => {
    // When the input loses focus, trigger the save logic.
    // This is where we mark the human interaction for saving.
    humanInteractionDetectedRef.current = true; // Mark as human interaction
    if (someHumanChangesDetected?.current) {
      someHumanChangesDetected.current.addOutput = true;
    }
    // Trigger the save logic immediately on blur.
    checkHasNextInvoice(
      () => saveChangesLogic(Number(amountInput), customPrice),
      true,
      productDoc.id
    );
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
