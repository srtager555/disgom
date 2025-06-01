import {
  DocumentReference,
  Timestamp,
  collection,
  CollectionReference,
  query,
  where,
  limit,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { creditBundle } from "./createBundle";
import { client } from "../createClient";

export const CREDIT_BUNDLE_SUBCOLLECTIONS = {
  CREDITS: "credits",
} as const;

export type CreditInBundle = {
  client_ref: DocumentReference<client>;
  bundle_ref: DocumentReference<creditBundle>; // Referencia al bundle padre
  amount: number;
  create_previus_amount: number;
  created_at: Timestamp;
  updated_at: Timestamp;
};

interface CreateOrUpdateCreditProps {
  bundle_ref: DocumentReference<creditBundle>;
  client_ref: DocumentReference<client>;
  amount: number;
  create_previus_amount?: number; // parametro para
}

export async function createOrUpdateCreditInBundle({
  bundle_ref,
  client_ref,
  amount,
  create_previus_amount = 0,
}: CreateOrUpdateCreditProps): Promise<DocumentReference<CreditInBundle>> {
  const creditsColRef = collection(
    bundle_ref,
    CREDIT_BUNDLE_SUBCOLLECTIONS.CREDITS
  ) as CollectionReference<CreditInBundle>;

  const q = query(
    creditsColRef,
    where("client_ref", "==", client_ref),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  const now = Timestamp.fromDate(new Date());

  if (!querySnapshot.empty) {
    // El crédito existe, actualizarlo
    const existingCreditDocRef = querySnapshot.docs[0]
      .ref as DocumentReference<CreditInBundle>;
    await updateDoc(existingCreditDocRef, {
      amount: amount,
      updated_at: now,
    });
    return existingCreditDocRef;
  } else {
    // El crédito no existe, crearlo
    const newCreditData: CreditInBundle = {
      client_ref,
      bundle_ref, // Guardamos una referencia al bundle padre
      amount,
      create_previus_amount,
      created_at: now,
      updated_at: now,
    };
    const newCreditDocRef = await addDoc(creditsColRef, newCreditData);
    return newCreditDocRef as DocumentReference<CreditInBundle>;
  }
}
