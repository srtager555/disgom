import {
  collection,
  CollectionReference,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { creditBundleContainerDoc, creditBundle } from "./createBundle";

export async function getAllCreditBunldes(
  sellerRef: DocumentReference<SellersDoc>
) {
  // Asumiendo que 'creditBundles' es una subcolección de 'sellers'
  const bundlesContainerCollRef = collection(
    sellerRef,
    SellersCollection.creditBundles.root
  ) as CollectionReference<creditBundleContainerDoc>;

  const q = query(
    bundlesContainerCollRef,
    where("current_free_bundle", "!=", null),
    where("disabled", "==", false)
  );

  const snap = await getDocs(q);

  const availableBundles = snap.docs.map(async (doc) => {
    const freeBundle = await getDoc(
      doc.data().current_free_bundle as DocumentReference<creditBundle>
    );

    return freeBundle;
  });

  return await Promise.all(availableBundles);
}
