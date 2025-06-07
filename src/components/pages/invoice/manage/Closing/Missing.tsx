import { useInvoice } from "@/contexts/InvoiceContext";
import { Container } from "@/styles/index.styles";
import { updateDoc } from "firebase/firestore";
import { useEffect, useState, useRef, useCallback } from "react";
import { debounce } from "lodash";

type props = {
  diff: number;
};

const SAVE_DIFF_DEBOUNCE_TIME = 1000; // 1 segundo de espera

export function Missing({ diff }: props) {
  const { invoice } = useInvoice();
  const [checkAsPaid, setCheckAsPaid] = useState(false);
  const initialLoadDone = useRef(false);
  const humanInteraction = useRef(false); // <--- Nueva Ref para rastrear interacción humana

  // Efecto para cargar el estado inicial de 'paid' desde la DB (solo una vez)
  useEffect(() => {
    if (initialLoadDone.current || !invoice) return;

    const savedDiffData = invoice.data()?.diff;
    if (savedDiffData) {
      console.log("Cargando estado 'paid' inicial:", savedDiffData.paid);
      setCheckAsPaid(savedDiffData.paid ?? false);
    }
    initialLoadDone.current = true;
  }, [invoice]);

  // --- Función debounced para guardar la diferencia ---
  const debouncedSaveDiff = useCallback(
    debounce(
      async (
        currentDiff: number,
        currentCheckAsPaid: boolean,
        currentInvoice: typeof invoice,
        isHumanChange: boolean // <--- Nuevo argumento
      ) => {
        if (!currentInvoice) {
          console.log("Debounced saveDiff omitido: Sin factura.");
          return;
        }

        const currentDiffInDb = currentInvoice.data()?.diff;
        const isPaidInDb = currentDiffInDb?.paid ?? false;
        const amountInDb = currentDiffInDb?.amount ?? 0;
        const shouldBePaid = currentDiff >= 0 || currentCheckAsPaid;

        // --- Condición de guardado mejorada ---
        // 1. Si NO fue un cambio humano Y el estado lógico no cambió Y el monto no cambió -> No guardar
        if (!isHumanChange) {
          console.log("Debounced saveDiff: Cambio no humano, omitiendo.");
          return;
        }
        // 2. Si (incluso con cambio humano) el estado lógico y el monto son iguales a DB -> No guardar
        if (amountInDb === currentDiff && isPaidInDb === shouldBePaid) {
          // console.log("Debounced saveDiff: Sin cambios efectivos vs DB, omitiendo guardado.");
          return;
        }
        // --- Fin Condición ---

        console.log(
          "Debounced saveDiff: Guardando diff:",
          currentDiff,
          "Paid:",
          shouldBePaid,
          "(Human:",
          isHumanChange,
          ")" // Log para depuración
        );

        const diffToSave = {
          amount: currentDiff,
          paid: shouldBePaid,
          paid_at:
            shouldBePaid && !isPaidInDb
              ? new Date()
              : currentDiffInDb?.paid_at ?? null,
        };

        try {
          await updateDoc(currentInvoice.ref, {
            diff: diffToSave,
          });
          console.log("Debounced saveDiff: Diff actualizado en Firestore.");
        } catch (error) {
          console.error("Debounced saveDiff: Error al actualizar diff:", error);
        }
      },
      SAVE_DIFF_DEBOUNCE_TIME
    ),
    []
  );

  // --- Efecto que llama a la función debounced ---
  useEffect(() => {
    if (!initialLoadDone.current) return;

    // Llama a la función debounced pasando el estado actual de humanInteraction
    debouncedSaveDiff(diff, checkAsPaid, invoice, humanInteraction.current);

    // Resetea el flag de interacción humana DESPUÉS de llamar al debounce
    // para que la próxima ejecución del efecto (si es solo por 'diff') no se marque como humana.
    humanInteraction.current = false;

    return () => {
      debouncedSaveDiff.cancel();
    };
  }, [diff, checkAsPaid, invoice, debouncedSaveDiff]);

  return (
    <Container styles={{ margin: "20px 0px" }} className="hide-print">
      <label
        style={{
          cursor: diff < 0 ? "pointer" : "not-allowed",
          opacity: diff < 0 ? 1 : 0.5,
        }}
      >
        <input
          type="checkbox"
          checked={checkAsPaid}
          onChange={(e) => {
            if (diff < 0) {
              // Marcar que la siguiente ejecución del efecto fue por interacción humana
              humanInteraction.current = true;
              setCheckAsPaid(e.target.checked);
            }
          }}
          disabled={diff >= 0}
        />{" "}
        Marcar faltante como pagado
      </label>
    </Container>
  );
}
