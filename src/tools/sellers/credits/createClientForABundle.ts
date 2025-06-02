import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { creditBundle } from "./createBundle";
import { clientCredit } from "./create";

type clientCreditBundleType = Omit<clientCredit, "route" | "created_at">;
export type clientCreditBundleDocType = Omit<clientCredit, "route">;

export async function createAClientForABundle(
  bundle_ref: DocumentReference<creditBundle>,
  data: clientCreditBundleType
) {
  const coll = collection(
    bundle_ref,
    "clients"
  ) as CollectionReference<clientCreditBundleDocType>;

  const dataToAdd: clientCreditBundleDocType = {
    ...data,
    created_at: Timestamp.fromDate(new Date()),
  };

  const ref = await addDoc(coll, dataToAdd);

  return ref;
}
