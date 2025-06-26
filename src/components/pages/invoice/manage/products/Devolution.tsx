import React, { useEffect, memo, MutableRefObject, useState } from "react";
import { Column, Input } from "../../Product";
import { DocumentSnapshot } from "firebase/firestore";
import { someHumanChangesDetected } from "./Product";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { useInvoice } from "@/contexts/InvoiceContext";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";
import { rawOutput } from "./AddOutput";
import { isEqual } from "lodash";

// --- Tipos ---

type props = {
  rawOutputs: rawOutput[];
  inventoryAmount: number;
  devoInput: string;
  setDevoInput: React.Dispatch<React.SetStateAction<string>>;
  setOverflowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  productDoc: DocumentSnapshot<productDoc>;
  sellerHasInventory: boolean | undefined;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
};

type devolutionBase = props & {
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
};

// --- Componente Principal (Exportado) ---

export function Devolution(props: props) {
  const { invoice: invoiceDoc } = useInvoice();

  return <DevolutionMemo {...props} invoiceDoc={invoiceDoc} />;
}

// --- Componente Memoizado ---

export const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  // Comparaciones básicas primero
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.invoiceDoc?.id !== next.invoiceDoc?.id) return false;
  if (prev.devoInput !== next.devoInput) return false;
  if (prev.inventoryAmount !== next.inventoryAmount) return false;
  if (!isEqual(prev.rawOutputs, next.rawOutputs)) return false;

  return true; // Si todo es igual, no re-renderizar
});

// --- Componente Base (Lógica) ---

function DevolutionBase({
  productDoc,
  sellerHasInventory,
  someHumanChangesDetected,
  rawOutputs,
  inventoryAmount,
  setDevoInput,
  setOverflowWarning,
  devoInput,
}: devolutionBase) {
  // --- Estados y Refs ---
  const [localDevoInput, setLocalDevoInput] = useState("0");

  // --- Efectos ---
  // Effect to reset state on product change
  useEffect(() => {
    // Reset devoInput to server amount when product changes or server amount updates
    setLocalDevoInput(String(devoInput));
  }, [productDoc.id, devoInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("typing in devo");
    parseNumberInput(setLocalDevoInput, e, { min: 0 });
  };

  const handleInputBlur = () => {
    const amount = rawOutputs.reduce((acc, next) => acc + next.amount, 0);

    if (Number(localDevoInput) > amount + inventoryAmount) {
      setOverflowWarning(true);
      return;
    }

    if (someHumanChangesDetected.current) {
      someHumanChangesDetected.current.devolution = true;
    }

    setDevoInput(localDevoInput);
    setOverflowWarning(false); // Reset warning on blur
  };

  // --- Renderizado ---

  // Solo muestra el input si el vendedor maneja inventario
  if (sellerHasInventory) {
    return (
      <Column>
        <Container className="show-print" styles={{ textAlign: "center" }}>
          {numberParser(Number(localDevoInput))}
        </Container>
        <Container className="hide-print">
          <Input
            value={localDevoInput}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
        </Container>
      </Column>
    );
  }

  // Si no tiene inventario, no renderiza nada
  return null;
}
