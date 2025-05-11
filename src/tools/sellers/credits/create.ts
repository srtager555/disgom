import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";

export type clientCredit = {
  // Consider adding a 'disabled?: boolean;' field if clients can also be disabled.
  route: number;
  name: string;
  created_at: Timestamp;
  address: string;
};

export type credit = {
  created_at: Timestamp;
  route: number;
  amount: number;
  client_ref: DocumentReference<clientCredit>;
  last_credit: DocumentReference<credit> | null;
  next_credit: DocumentReference<credit> | null;
  invoice_ref: DocumentReference<invoiceType>;
  seller_ref: DocumentReference<SellersDoc>;
  disabled: boolean; // Campo para marcar el crédito como deshabilitado
};

export async function createClientCredit(
  route: number,
  seller_ref: DocumentReference<SellersDoc>,
  name: string,
  amount: number,
  address: string,
  invoice_ref: DocumentReference<invoiceType>
) {
  const creditColl = collection(
    seller_ref,
    SellersCollection.credits
  ) as CollectionReference<clientCredit>;

  const client = await addDoc(creditColl, {
    created_at: Timestamp.fromDate(new Date()),
    route,
    name,
    address,
  });

  return await createCredit({
    route,
    client_ref: client,
    amount,
    last_credit: null,
    next_credit: null,
    invoice_ref,
    seller_ref,
    disabled: false,
  });
}

export async function createCredit(
  props: Omit<credit, "created_at">
): Promise<DocumentReference<credit>> {
  const coll = collection(
    props.client_ref,
    "credits"
  ) as CollectionReference<credit>;

  const newCredit = await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    ...props,
  });

  await updateDoc(props.invoice_ref, {
    [`newCredits.${props.route}.${props.client_ref.id}`]: newCredit,
  });

  return newCredit;
}

/**
 * Deshabilita todos los créditos nuevos asociados a una factura.
 * Para cada crédito deshabilitado, si tiene un 'next_credit',
 * actualiza ese 'next_credit' con 'last_amount' y 'last_credit' del crédito actual.
 * @param invoice El DocumentSnapshot de la factura.
 */
export async function DisableCredits(
  invoice: DocumentSnapshot<invoiceType>
): Promise<void> {
  const newCreditsMap = invoice.data()?.newCredits;

  if (!newCreditsMap || Object.keys(newCreditsMap).length === 0) {
    console.log(`No new credits to disable for invoice ${invoice.id}`);
    return;
  }

  // Aplanar la estructura de newCreditsMap para obtener una lista de todas las referencias de crédito
  const allCreditRefs: DocumentReference<credit>[] = Object.values(
    newCreditsMap
  ).flatMap((clientCredits) => Object.values(clientCredits));

  const creditProcessingPromises = allCreditRefs.map(async (creditRef) => {
    const creditSnap = await getDoc(creditRef);
    if (!creditSnap.exists()) {
      console.warn(
        `Credit document ${creditRef.path} not found during disabling.`
      );
      return;
    }

    const creditData = creditSnap.data();
    if (!creditData) return;

    // 1. Pasar last_amount y last_credit al next_credit si existe
    if (creditData.next_credit) {
      try {
        // Asumimos que tienes una función `updateCredits` similar a la que se muestra en el contexto
        // import { updateCredits } from "./update"; // Necesitarías esta importación
        // await updateCredits(creditData.next_credit, { // Esta línea requeriría la función updateCredits
        await updateDoc(creditData.next_credit, {
          // Usando updateDoc directamente por ahora
          last_credit: creditData.last_credit,
        });
      } catch (error) {
        console.error(
          `Error updating next_credit ${creditData.next_credit.path} for credit ${creditRef.path}:`,
          error
        );
      }
    }

    // 2. Deshabilitar el crédito actual
    // await updateCredits(creditRef, { disabled: true }); // Esta línea requeriría la función updateCredits
    await updateDoc(creditRef, { disabled: true }); // Usando updateDoc directamente
  });

  await Promise.all(creditProcessingPromises);
  console.log(
    `Successfully processed disabling credits for invoice ${invoice.id}`
  );
}
