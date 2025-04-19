import { useInvoice } from "@/contexts/InvoiceContext";
import { numberParser } from "@/tools/numberPaser";
import {
  credit,
  createCredit,
  clientCredit,
} from "@/tools/sellers/credits/create";
import { getClientCredits } from "@/tools/sellers/credits/get";
import {
  DocumentSnapshot,
  DocumentReference,
  getDoc,
} from "firebase/firestore";
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { Column, Input } from "../../Product";
import { debounce } from "lodash";
import { updateCredits } from "@/tools/sellers/credits/update";
import { rawCreditResult } from "@/pages/invoices/manage";

type SavedCreditsMap = Record<string, DocumentReference<credit>>;

interface CreditClientProps {
  clientCredit: DocumentSnapshot<clientCredit>;
  setRawCreditResult: Dispatch<SetStateAction<rawCreditResult>>;
}

export const CreditClient = ({
  clientCredit,
  setRawCreditResult,
}: CreditClientProps) => {
  const [currentCredit, setCurrentCredit] = useState<
    DocumentSnapshot<credit> | undefined
  >(undefined);
  const [amount, setAmount] = useState<number | string>(0);
  const [diff, setDiff] = useState(0);
  const { invoice } = useInvoice();

  // Efecto para obtener o crear el crédito inicial para este cliente en esta factura
  useEffect(() => {
    const getOrCreateCredit = async () => {
      if (!invoice || !invoice.exists()) {
        console.warn("Factura no disponible o no existe.");
        setCurrentCredit(undefined); // Asegura limpiar estado si la factura desaparece
        setAmount(0);
        return;
      }

      // 2. Obtener el mapa de créditos desde la factura actual
      const newCreditsMap =
        (invoice.data()?.newCredits as SavedCreditsMap | undefined) ?? {};
      const creditInfoForClient = newCreditsMap[clientCredit.id];

      let existingCreditSnapshot: DocumentSnapshot<credit> | undefined =
        undefined;

      // 3. Intentar obtener el Snapshot si la info existe en newCredits
      if (creditInfoForClient) {
        try {
          const creditDoc = await getDoc(creditInfoForClient);
          if (creditDoc.exists()) {
            console.log("se obtuvo el credit correctamente");
            existingCreditSnapshot = creditDoc;
          } else {
            console.warn(
              `Referencia de crédito en newCredits para ${clientCredit.id} apunta a un documento inexistente. Se creará uno nuevo.`
            );
            // Tratar como si no existiera para proceder a la creación
          }
        } catch (error) {
          console.error(
            `Error al obtener documento de crédito desde referencia para ${clientCredit.id}:`,
            error
          );
          // Considerar si se debe intentar crear uno nuevo o mostrar error
        }
      }

      // 4. Si se encontró y obtuvo el snapshot desde invoice.data().newCredits
      if (existingCreditSnapshot) {
        setCurrentCredit(existingCreditSnapshot);
        setAmount(existingCreditSnapshot.data()?.amount ?? 0);
        console.log(
          `Usando crédito actual de la facturapara cliente ${clientCredit.id}`
        );
      } else {
        // 5. Si NO está en `invoice.data().newCredits` (o la referencia era inválida), crearlo.
        console.log(
          `Crédito NO encontrado en invoice.data().newCredits para cliente ${clientCredit.id}, creando nuevo...`
        );

        try {
          const lastCredit = await getClientCredits(clientCredit.ref);

          const newCurrentRef = await createCredit({
            amount: 0, // Iniciar en 0 para la nueva factura
            client_ref: clientCredit.ref,
            last_amount: lastCredit?.data()?.amount ?? null,
            last_credit: lastCredit?.ref ?? null,
            next_credit: null,
            invoice_ref: invoice.ref,
            seller_ref: invoice.data().seller_ref, // Asegúrate que seller_ref exista
          });

          if (lastCredit)
            await updateCredits(lastCredit.ref, {
              next_credit: lastCredit,
            });

          const newCurrent = await getDoc(newCurrentRef);

          if (newCurrent.exists()) {
            setCurrentCredit(newCurrent as DocumentSnapshot<credit>);
            setAmount(0);

            console.log(`Nuevo crédito creado para cliente ${clientCredit.id}`);
          } else {
            console.error(
              "Error: No se pudo obtener el documento del crédito recién creado."
            );
            setCurrentCredit(undefined); // Limpiar estado en caso de error
            setAmount(0);
          }
        } catch (error) {
          console.error("Error al crear el crédito:", error);
          setCurrentCredit(undefined); // Limpiar estado en caso de error
          setAmount(0);
        }
      }
    };

    getOrCreateCredit();
    // Dependencias: invoice y clientCredit.id/ref
  }, [invoice]);

  // Efecto para calcular la diferencia (sin cambios)
  useEffect(() => {
    const lastAmount = currentCredit?.data()?.last_amount ?? 0;
    const currentAmount = Number(amount) || 0;
    const diff = lastAmount - currentAmount;

    setDiff(diff);
    setRawCreditResult((prev) => ({ ...prev, [clientCredit.id]: diff }));
  }, [currentCredit, amount]);

  // --- Lógica para guardar el crédito con Debounce (sin cambios) ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveCredit = useCallback(
    debounce(async (newAmount: number) => {
      if (!invoice || !currentCredit || !currentCredit.exists()) {
        console.log("Guardado omitido: Faltan datos (invoice, currentCredit)");
        return;
      }

      const currentAmountInDb = currentCredit.data()?.amount ?? 0;

      if (newAmount === currentAmountInDb) {
        console.log(
          `Guardado omitido para ${clientCredit.id}: Monto (${newAmount}) no ha cambiado.`
        );
        return;
      }

      console.log(`Guardando crédito para ${clientCredit.id}: ${newAmount}`);
      try {
        await updateCredits(currentCredit.ref, { amount: newAmount });
        console.log(
          `Crédito actualizado correctamente para ${clientCredit.id}`
        );
      } catch (error) {
        console.error(
          `Error al actualizar el crédito para ${clientCredit.id}:`,
          error
        );
      }
    }, 1000),
    [invoice, currentCredit, clientCredit.id]
  );

  // Efecto que llama a la función debounced
  useEffect(() => {
    if (currentCredit !== undefined) {
      const numericAmount = Number(amount);
      if (!isNaN(numericAmount)) {
        debouncedSaveCredit(numericAmount);
      }
    }
  }, [amount, currentCredit, debouncedSaveCredit]);

  // Handler para el input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  // Renderizado
  return (
    <>
      <Column gridColumn="1 / 3">
        {clientCredit.data()?.name ?? "Nombre no disponible"}
      </Column>
      <Column>{numberParser(currentCredit?.data()?.last_amount ?? 0)}</Column>
      <Column>
        <Input
          type="number"
          value={amount}
          name="amount"
          onChange={handleAmountChange}
        />
      </Column>
      <Column>{numberParser(diff)}</Column>
    </>
  );
};
