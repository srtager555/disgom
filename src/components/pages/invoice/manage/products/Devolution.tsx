import React, { useEffect, memo, MutableRefObject } from "react";
import { Column, Input } from "../../Product";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import { someHumanChangesDetected } from "./Product";
import { isEqual } from "lodash";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { useInvoice } from "@/contexts/InvoiceContext";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";

// --- Tipos ---

type props = {
  devoInput: string;
  setDevoInput: React.Dispatch<React.SetStateAction<string>>;
  productDoc: DocumentSnapshot<productDoc>;
  sellerHasInventory: boolean | undefined;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
  currentDevolutionServerAmount: number;
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
  if (prev.currentDevolutionServerAmount !== next.currentDevolutionServerAmount)
    return false;

  return true; // Si todo es igual, no re-renderizar
});

// --- Componente Base (Lógica) ---

function DevolutionBase({
  productDoc,
  sellerHasInventory,
  someHumanChangesDetected,
  devoInput,
  setDevoInput,
  currentDevolutionServerAmount,
}: devolutionBase) {
  // --- Estados y Refs ---

  // --- Efectos ---
  // Effect to reset state on product change
  useEffect(() => {
    // Reset devoInput to server amount when product changes or server amount updates
    setDevoInput(String(currentDevolutionServerAmount));
  }, [productDoc.id, currentDevolutionServerAmount, setDevoInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseNumberInput(setDevoInput, e, { min: 0 });
  };

  const handleInputBlur = () => {
    if (someHumanChangesDetected.current) {
      someHumanChangesDetected.current.devolution = true;
    }
    // The useManageDevolutions hook will detect the change in devoInput
    // combined with humanInteractionDetectedRef and trigger the save.
    // No direct call to checkHasNextInvoice here.
  };

  // --- Renderizado ---

  // Solo muestra el input si el vendedor maneja inventario
  if (sellerHasInventory) {
    return (
      <Column>
        <Container className="show-print" styles={{ textAlign: "center" }}>
          {numberParser(Number(devoInput))}
        </Container>
        <Container className="hide-print">
          <Input
            value={devoInput}
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
