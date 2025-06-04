import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { creditBundleContainerDoc } from "./createBundle";
import { clientCredit } from "./create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";

type clientCreditBundleType = Omit<clientCredit, "route" | "created_at">;
export type clientCreditBundleDocType = Omit<clientCredit, "route">;

export async function createAClientForABundle(
  bundle_container_ref: DocumentReference<creditBundleContainerDoc>,
  data: clientCreditBundleType
) {
  const coll = collection(
    bundle_container_ref,
    SellersCollection.creditBundles.clients
  ) as CollectionReference<clientCreditBundleDocType>;

  const dataToAdd: clientCreditBundleDocType = {
    ...data,
    created_at: Timestamp.fromDate(new Date()),
  };

  const ref = await addDoc(coll, dataToAdd);

  return ref;
}
