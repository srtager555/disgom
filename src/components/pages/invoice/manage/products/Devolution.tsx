import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useCallback, // Importa useCallback
  useMemo,
  memo,
  MutableRefObject,
} from "react";
import { Column, Input } from "../../Product";
import { saveDevolution } from "@/tools/products/saveDevolution";
import debounce from "lodash/debounce"; // <-- Importa debounce
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { SellersDoc } from "@/tools/sellers/create";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import { rawOutput } from "./AddOutput";
import { someHumanChangesDetected } from "./Product";
import { isEqual } from "lodash";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";
import { useInvoice } from "@/contexts/InvoiceContext";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";

// --- Tipos ---

type props = {
  productDoc: QueryDocumentSnapshot<productDoc>;
  sellerHasInventory: boolean | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;
  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
  inventory: DocumentSnapshot<inventory_output>[]; // outputs del inventario del vendedor
};

type devolutionBase = props & {
  outputs: DocumentSnapshot<outputType>[]; // outputs de la factura actual para este producto
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
  currentServerDevolution: number;
};

const SAVE_DEVOLUTION_DEBOUNCE_TIME = 1000; // 1 segundo de espera

// --- Componente Principal (Exportado) ---

export function Devolution(props: props) {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  const outputs = useGetProductOutputByID(props.productDoc.id); // Obtiene outputs de la factura
  const { invoice: invoiceDoc } = useInvoice();

  console.log("los oyutputs de la devo", currentInventory.outputs);

  // Calcula la devolución actual basada en los 'outputs' de la factura
  const currentServerDevolution = useMemo(
    () =>
      currentInventory.outputs?.reduce(
        (acc, next) => acc + next.data().amount,
        0
      ) || 0,
    [currentInventory]
  );

  return (
    <DevolutionMemo
      {...props}
      outputs={outputs}
      invoiceDoc={invoiceDoc}
      currentServerDevolution={currentServerDevolution}
    />
  );
}

// --- Componente Memoizado ---

export const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  // Comparaciones básicas primero
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.customPrice !== next.customPrice) return false;
  if (prev.currentServerDevolution !== next.currentServerDevolution)
    return false;
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
  currentServerDevolution,
  someHumanChangesDetected,
}: devolutionBase) {
  // --- Estados y Refs ---
  const [devo, setDevo] = useState(String(currentServerDevolution)); // Input state, inicializado con valor del servidor
  const [lastHasInventory, setLastHasInventory] = useState<boolean | undefined>(
    sellerHasInventory
  );
  const [localCurrentDevo, setLocalCurrentDevo] = useState(
    currentServerDevolution
  ); // Estado local "confirmado" tras guardar
  const [localCurrentDevoHistory, setLocalCurrentDevoHistory] = useState<
    number[]
  >([currentServerDevolution]); // Historial para evitar sobrescritura por datos del servidor
  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastCustomPrice = useRef(customPrice);
  const humanAmountChanged = useRef<boolean>(false); // Flag para saber si el cambio fue por interacción humana

  // --- Efectos ---

  // effect to sync local state with server state if not in history
  useEffect(() => {
    // Si el valor del servidor cambia Y no está en el historial reciente de valores guardados localmente,
    // actualiza el estado local y el historial.
    if (!localCurrentDevoHistory.includes(currentServerDevolution)) {
      // console.log(
      //   `Server devolution (${currentServerDevolution}) not in history [${localCurrentDevoHistory.join(
      //     ", "
      //   )}]. Updating local state.`
      // );
      setLocalCurrentDevo(currentServerDevolution);
      setLocalCurrentDevoHistory((prev) =>
        [...prev, currentServerDevolution].slice(-10)
      ); // Mantener historial corto
    }
  }, [currentServerDevolution]); // Solo depende del valor del servidor

  // effect to sync input field ('devo') with local confirmed state ('localCurrentDevo')
  useEffect(() => {
    // Si el valor del input es diferente del estado local confirmado,
    // actualiza el input para reflejar el estado local.
    // Esto ocurre después de que el guardado (debounced) actualiza localCurrentDevo,
    // o cuando el efecto anterior actualiza localCurrentDevo por un cambio del servidor.
    if (Number(devo) !== localCurrentDevo) {
      // console.log(
      //   `Syncing input 'devo' (${devo}) with 'localCurrentDevo' (${localCurrentDevo})`
      // );
      setDevo(String(localCurrentDevo));
      // Importante: NO marcar humanAmountChanged.current = false aquí,
      // porque este cambio NO es una interacción humana directa con el input.
    }
  }, [localCurrentDevo]); // Depende solo del estado local confirmado

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice !== lastCustomPrice.current) {
      humanAmountChanged.current = true; // El cambio de precio también debe disparar el guardado
      lastCustomPrice.current = customPrice;
      // console.log("Price changed in devolution, marking human change", customPrice);
    }
  }, [customPrice]);

  // effect to detect if the seller inventory status changes (opcional, ¿debería disparar guardado?)
  useEffect(() => {
    if (sellerHasInventory !== lastHasInventory) {
      // Considera si este cambio realmente debería disparar un guardado.
      // Si solo afecta la UI (mostrar/ocultar el input), no hagas nada aquí.
      // Si debe guardar (poco probable), marca humanAmountChanged.
      // humanAmountChanged.current = true; // Descomenta si este cambio debe forzar guardado
      setLastHasInventory(sellerHasInventory);
      // console.log("sellerHasInventory changed", sellerHasInventory);
    }
  }, [sellerHasInventory, lastHasInventory]);

  // --- Función debounced para guardar la devolución ---
  const debouncedSaveDevolution = useCallback(
    debounce(
      async (
        currentDevoToSave: number, // Valor del input que se intenta guardar
        currentCustomPrice: number | undefined,
        currentInvoiceDoc: typeof invoiceDoc,
        currentProductDoc: typeof productDoc,
        currentSeller: typeof seletedSeller,
        currentInventoryOutputs: typeof inventory_outputs,
        currentOutputs: typeof outputs,
        currentLocalDevoState: number, // Estado local confirmado actual
        isHumanChangeRef: MutableRefObject<boolean>
      ) => {
        // Solo pasara si los datos esenciales están presentes.
        if (!currentInvoiceDoc || !currentProductDoc || !currentSeller) {
          return;
        }

        console.log(
          `Debounced saveDevolution: Attempting to save devo: ${currentDevoToSave} (Local was ${currentLocalDevoState}, HumanChange: ${isHumanChangeRef.current})`
        );

        // Llama a la función externa que contiene la lógica de guardado
        const success = await saveDevolution(
          currentInvoiceDoc,
          currentProductDoc,
          currentSeller,
          currentInventoryOutputs,
          currentOutputs,
          currentDevoToSave, // Usa el valor del input que disparó el debounce
          currentCustomPrice,
          setRemainStock, // Pasa el setter directamente
          isHumanChangeRef, // Pasa el ref del flag de cambio humano (saveDevolution lo reseteará si guarda)
          currentLocalDevoState // Pasa el estado local actual para comparación interna si es necesario
        );

        // Si saveDevolution fue exitoso (o si siempre debe actualizarse el estado local)
        if (success) {
          // Asume que saveDevolution devuelve true/false o maneja errores internos
          setLocalCurrentDevo(currentDevoToSave); // Actualiza el estado local con el valor guardado
          setLocalCurrentDevoHistory((prevHistory) => {
            const newHistory = [...prevHistory, currentDevoToSave];
            if (newHistory.length > 10) {
              newHistory.shift();
            }
            // console.log("Devolution save success. New local history:", newHistory);
            return newHistory;
          });
          // El flag humanAmountChanged ya debería haber sido reseteado por saveDevolution
        } else {
          // Opcional: Revertir el input 'devo' al 'localCurrentDevo' anterior si falla
          // setDevo(currentLocalDevoState);
          // Asegurarse de resetear el flag si falló para no reintentar indefinidamente
          isHumanChangeRef.current = false;
        }
      },
      SAVE_DEVOLUTION_DEBOUNCE_TIME
    ),
    [setRemainStock] // Dependencias de useCallback: setters de estado o funciones estables
  );

  // --- Efecto que llama a la función debounced ---
  useEffect(() => {
    // No hacer nada si los documentos esenciales no están listos
    // O si el valor del input es exactamente el mismo que el estado local confirmado
    // Y no hubo un cambio humano reciente (evita llamadas innecesarias si el estado local ya está sincronizado)
    if (!invoiceDoc || !productDoc || !seletedSeller) {
      return;
    }

    const numericDevo = Number(devo);

    if (isNaN(numericDevo)) {
      console.log("Invalid devo detected, maybe is a decimal number?");
      return;
    }

    // Llama a la función debounced CADA VEZ que 'devo' (el input) o 'customPrice' cambien.
    // La lógica DENTRO de debouncedSaveDevolution decidirá si realmente necesita guardar.
    checkHasNextInvoice(
      () =>
        debouncedSaveDevolution(
          numericDevo, // Usa el valor actual del input
          customPrice,
          invoiceDoc,
          productDoc,
          seletedSeller,
          inventory_outputs,
          outputs,
          localCurrentDevo, // Pasa el estado local confirmado actual
          humanAmountChanged // Pasa el ref del flag de interacción humana
        ),
      humanAmountChanged.current,
      productDoc.id
    );

    // Función de limpieza para cancelar el debounce si el componente se desmonta
    // o si alguna de las dependencias cambia ANTES de que el debounce se ejecute.
    return () => {
      // console.log("Canceling previous debounce for devo:", devo);
      debouncedSaveDevolution.cancel();
    };
  }, [
    devo, // Depende del valor del input
    customPrice,
    invoiceDoc,
    productDoc,
    seletedSeller,
    inventory_outputs,
    outputs,
    localCurrentDevo, // Añadido como dependencia para la lógica interna del debounce
    debouncedSaveDevolution, // La función debounced en sí misma
    checkHasNextInvoice,
  ]);

  // --- Renderizado ---

  // Solo muestra el input si el vendedor maneja inventario
  if (sellerHasInventory) {
    return (
      <Column>
        <Container className="show-print" styles={{ textAlign: "center" }}>
          {numberParser(Number(devo))}
        </Container>
        <Container className="hide-print">
          <Input
            value={devo} // El valor siempre refleja el estado 'devo' del input
            onChange={(e) => {
              parseNumberInput(setDevo, e, { min: 0 });
              humanAmountChanged.current = true; // Marca como cambio humano
              someHumanChangesDetected.current.devolution = true; // Notifica al componente padre
            }}
          />
        </Container>
      </Column>
    );
  }

  // Si no tiene inventario, no renderiza nada
  return null;
}
