import { useInvoice } from "@/contexts/InvoiceContext";
import { numberParser } from "@/tools/numberPaser";
import { DocumentSnapshot } from "firebase/firestore";
import { useState, useEffect, useCallback, useRef } from "react";
import { Column, Input } from "../../Product";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { AnalyzedCreditItem } from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { createOrUpdateCreditInBundle } from "@/tools/sellers/credits/createOrUpdateCreditInBundle";
import { creditBundle } from "@/tools/sellers/credits/createBundle";
import { parseNumberInput } from "@/tools/parseNumericInput";

interface CreditClientProps {
  credit: AnalyzedCreditItem;
  bundleSnap: DocumentSnapshot<creditBundle>;
}

export const CreditClient = ({ credit, bundleSnap }: CreditClientProps) => {
  const [currentCredit, setCurrentCredit] = useState<number | undefined>(
    undefined
  );
  const [amount, setAmount] = useState<number | string>(0);
  const { invoice } = useInvoice();
  const { checkHasNextInvoiceCreditSection } = useHasNextInvoice();
  const humanDetected = useRef(false);

  // --- Lógica para guardar el crédito con Debounce (sin cambios) ---
  const saveCredit = useCallback(
    async (newAmount: number) => {
      if (!humanDetected.current) {
        console.log("Guardado omitido: No es humano");
        return;
      }

      if (!invoice) {
        console.log("Guardado omitido: Faltan datos (invoice)");
        humanDetected.current = false;
        return;
      }

      const currentAmountInDb = currentCredit ?? 0;

      if (newAmount === currentAmountInDb) {
        humanDetected.current = false;
        console.log("Guardado omitido: No hay cambios");
        return;
      }

      console.log(`Guardando crédito para ${credit.client.id}: ${newAmount}`);
      try {
        createOrUpdateCreditInBundle({
          bundle_ref: bundleSnap.ref,
          client_ref: credit.client.ref,
          amount: newAmount,
        });
        // await updateCredits(currentCredit.ref, { amount: newAmount });
        console.log(
          `Crédito actualizado correctamente para ${credit.client.id}`
        );
      } catch (error) {
        console.error(
          `Error al actualizar el crédito para ${credit.client.id}:`,
          error
        );
      } finally {
        humanDetected.current = false;
      }
    },
    [invoice, currentCredit, credit.client.id]
  );

  // Efecto para actualizar el currentCredit
  useEffect(() => {
    setCurrentCredit(credit.current_credit ?? 0);
    setAmount(credit.current_credit ?? 0);
  }, [credit.current_credit]);

  // Efecto que llama a la función debounced
  useEffect(() => {
    if (currentCredit !== undefined) {
      const numericAmount = Number(amount);
      if (!isNaN(numericAmount)) {
        checkHasNextInvoiceCreditSection(
          bundleSnap,

          () => saveCredit(numericAmount)
        );
      }
    }
  }, [
    amount,
    currentCredit,
    saveCredit,
    checkHasNextInvoiceCreditSection,
    bundleSnap,
  ]);

  // Handler para el input
  const handleOnBlurAmount = async (e: React.ChangeEvent<HTMLInputElement>) => {
    humanDetected.current = true;
    const amount = parseNumberInput(setAmount, e, { returnRaw: true });
    await saveCredit(Number(amount));
  };

  const hanleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseNumberInput(setAmount, e, { returnRaw: true });
  };

  // Renderizado
  return (
    <>
      <Column gridColumn="1 / 3">
        {credit.client.data()?.name ?? "Nombre no disponible"}
      </Column>
      <Column>{numberParser(credit.last_credit ?? 0)}</Column>
      <Column>
        <Input
          type="text"
          value={amount}
          name="amount"
          onChange={hanleOnChange}
          onBlur={handleOnBlurAmount}
        />
      </Column>
      <Column>{numberParser(credit.difference)}</Column>
    </>
  );
};
