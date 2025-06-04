import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { Firestore } from "@/tools/firestore";

export type creditBundle = {
  created_at: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  last_bundle: DocumentReference<creditBundle> | null;
  next_bundle: DocumentReference<creditBundle> | null;
  bundle_container_ref: DocumentReference<creditBundleContainerDoc>;
  disabled: boolean; // Campo para marcar el bundle como deshabilitado
};

interface creditBundleprops {
  seller_ref: DocumentReference<SellersDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  bundle_container_ref?: DocumentReference<creditBundleContainerDoc> | null;
}

export interface creditBundleContainerDoc {
  disabled: boolean;
  created_at: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  current_free_bundle: DocumentReference<creditBundle> | null;
}

export async function createCreditBundleContainer(
  seller_ref: DocumentReference<SellersDoc>
): Promise<DocumentReference<creditBundleContainerDoc>> {
  return await addDoc(
    collection(
      seller_ref,
      SellersCollection.creditBundles.root
    ) as CollectionReference<creditBundleContainerDoc>,
    {
      disabled: false,
      created_at: Timestamp.fromDate(new Date()),
      seller_ref,
      current_free_bundle: null,
    }
  );
}

export async function createCreditBundle({
  seller_ref,
  invoice_ref,
  bundle_container_ref,
}: creditBundleprops): Promise<DocumentReference<creditBundle>> {
  return await runTransaction(Firestore(), async (transaction) => {
    console.log(
      "Creating credit bundle, bundle container: " + bundle_container_ref?.path
    );
    if (!bundle_container_ref) {
      try {
        console.log("Creating credit bundle container");
        bundle_container_ref = await createCreditBundleContainer(seller_ref);
      } catch (error) {
        console.log(error);
        throw new Error("Failed to create credit bundle container");
      }
    }

    const coll = collection(
      bundle_container_ref,
      SellersCollection.creditBundles.bundles.root
    ) as CollectionReference<creditBundle>;

    const bundlesContainer = await transaction.get(bundle_container_ref);
    const bundleContainerData = bundlesContainer.data();

    if (!bundleContainerData) {
      console.log("Bundle container data not found", bundlesContainer);
      throw new Error("Bundle container data not found");
    }

    const previus_bundle_ref = bundleContainerData.current_free_bundle;

    const newBundleData: creditBundle = {
      created_at: Timestamp.fromDate(new Date()),
      seller_ref,
      invoice_ref,
      bundle_container_ref,
      last_bundle: previus_bundle_ref,
      next_bundle: null,
      disabled: false,
    };

    // create the new bundle
    const newBundleRef = doc(coll);
    transaction.set(newBundleRef, newBundleData);

    // update the current free bundle
    transaction.update(bundle_container_ref, {
      current_free_bundle: newBundleRef,
    });

    // add the bundle to the invoice
    transaction.update(invoice_ref, {
      credit_bundle_ref: newBundleRef,
    });

    // If there was a previous bundle, update its next_bundle field
    if (previus_bundle_ref) {
      transaction.update(previus_bundle_ref, {
        next_bundle: newBundleRef,
      });
    }
    return newBundleRef;
  });
}
