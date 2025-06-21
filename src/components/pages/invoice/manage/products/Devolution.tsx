import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  MutableRefObject,
} from "react";
import { Column, Input } from "../../Product";
import { saveDevolution } from "@/tools/products/saveDevolution";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { outputParser, outputType } from "@/tools/products/addOutputs";
import { SellersDoc } from "@/tools/sellers/create";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import { rawOutput } from "./AddOutput";
import { someHumanChangesDetected } from "./Product";
import { isEqual } from "lodash";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { useInvoice } from "@/contexts/InvoiceContext";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { useManageDevolutionAmount } from "@/hooks/invoice/useManageDevolutionAmount";

// --- Tipos ---

type props = {
  rawOutputs: rawOutput[];
  productDoc: QueryDocumentSnapshot<productDoc>;
  sellerHasInventory: boolean | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;
  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
  inventory: DocumentSnapshot<inventory_output>[]; // outputs del inventario del vendedor
};

type devolutionBase = props & {
  outputs: outputType[]; // los outputs procesados
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
};

// --- Componente Principal (Exportado) ---

export function Devolution(props: props) {
  const { invoice: invoiceDoc } = useInvoice();

  const outputs = useMemo(() => {
    let arr: outputType[] = [];

    if (invoiceDoc) {
      arr = props.rawOutputs.map((raw) =>
        outputParser(invoiceDoc, props.productDoc, raw)
      );
    }

    console.log("Hubo un cambio en los outputs de la factura", arr);
    return arr;
  }, [props.rawOutputs, invoiceDoc, props.productDoc]);

  return (
    <DevolutionMemo {...props} outputs={outputs} invoiceDoc={invoiceDoc} />
  );
}

// --- Componente Memoizado ---

export const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  // Comparaciones básicas primero
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.seletedSeller?.id !== next.seletedSeller?.id) return false;
  if (prev.invoiceDoc?.id !== next.invoiceDoc?.id) return false;

  // Comparaciones más complejas
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (!isEqual(prev.inventory, next.inventory)) return false;
  // setRemainStock y someHumanChangesDetected son setters/refs, no necesitan comparación profunda
  // if (prev.setRemainStock !== next.setRemainStock) return false; // No comparar funciones directamente
  // if (prev.someHumanChangesDetected !== next.someHumanChangesDetected) return false; // No comparar refs directamente

  return true; // Si todo es igual, no re-renderizar
});

// --- Componente Base (Lógica) ---

function DevolutionBase({
  outputs, // outputs de la factura
  productDoc,
  invoiceDoc,
  inventory: inventory_outputs, // outputs del inventario
  customPrice,
  setRemainStock,
  seletedSeller,
  sellerHasInventory,
  someHumanChangesDetected,
}: devolutionBase) {
  // --- Estados y Refs ---
  const [devoInput, setDevoInput] = useState<string>("0");
  const { currentServerDevolution, notifyIsWritting } =
    useManageDevolutionAmount(setDevoInput, productDoc.id);

  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastCustomPriceRef = useRef(customPrice);
  const debouncedSaveOperationToCancel = useRef(() => {});
  const isCurrentlySavingRef = useRef(false);
  const humanInteractionDetectedRef = useRef(false);

  // --- Efectos ---

  // Effect to reset state on product change
  useEffect(() => {
    lastCustomPriceRef.current = customPrice;
    humanInteractionDetectedRef.current = false;
    isCurrentlySavingRef.current = false;
  }, [productDoc.id, customPrice]);

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice !== lastCustomPriceRef.current) {
      humanInteractionDetectedRef.current = true; // El cambio de precio también debe disparar el guardado
      lastCustomPriceRef.current = customPrice;
    }
  }, [customPrice]);

  // --- Función para guardar la devolución ---
  const saveChangesLogic = useCallback(
    (amountToSave: number, priceToSave: number | undefined) => {
      if (isCurrentlySavingRef.current) return;
      if (!invoiceDoc || !seletedSeller) return;

      if (
        amountToSave === currentServerDevolution &&
        priceToSave === lastCustomPriceRef.current
      ) {
        humanInteractionDetectedRef.current = false;
        return;
      }

      isCurrentlySavingRef.current = true;

      try {
        debouncedSaveOperationToCancel.current();

        debouncedSaveOperationToCancel.current = saveDevolution(
          invoiceDoc,
          productDoc,
          seletedSeller,
          inventory_outputs,
          outputs,
          amountToSave,
          priceToSave,
          setRemainStock
        );

        lastCustomPriceRef.current = priceToSave;
        humanInteractionDetectedRef.current = false;
      } catch (error) {
        console.error("Error during devolution save:", error);
      } finally {
        isCurrentlySavingRef.current = false;
      }
    },
    [
      invoiceDoc,
      productDoc,
      seletedSeller,
      inventory_outputs,
      outputs,
      setRemainStock,
      currentServerDevolution,
    ]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseNumberInput(setDevoInput, e, { min: 0 });
    notifyIsWritting();
  };

  const handleInputBlur = () => {
    humanInteractionDetectedRef.current = true;
    if (someHumanChangesDetected.current) {
      someHumanChangesDetected.current.devolution = true;
    }
    checkHasNextInvoice(
      () => saveChangesLogic(Number(devoInput), customPrice),
      true,
      productDoc.id
    );
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
