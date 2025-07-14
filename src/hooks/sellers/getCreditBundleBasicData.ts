import { useInvoice } from "@/contexts/InvoiceContext";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import {
  creditBundle,
  creditBundleContainerDoc,
} from "@/tools/sellers/credits/createBundle";
import { clientCreditBundleDocType } from "@/tools/sellers/credits/createClientForABundle";
import { CreditInBundle } from "@/tools/sellers/credits/createOrUpdateCreditInBundle";
import {
  CollectionReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export function useGetCreditBundleBasicData() {
  const { invoice } = useInvoice();
  const [bundleContainer, setBundleContainer] =
    useState<DocumentSnapshot<creditBundleContainerDoc>>();
  const [creditBundle, setCreditBundle] =
    useState<DocumentSnapshot<creditBundle>>();
  const [previusCreditBundle, setPreviusCreditBundle] =
    useState<DocumentSnapshot<creditBundle>>();
  const [currentBundleCredits, setCurrentBundleCredits] = useState<
    QueryDocumentSnapshot<CreditInBundle>[]
  >([]);
  const [previusBundleCredits, setPreviusBundleCredits] = useState<
    QueryDocumentSnapshot<CreditInBundle>[]
  >([]);
  const [clients, setClients] = useState<
    QueryDocumentSnapshot<clientCreditBundleDocType>[]
  >([]);
  const invoiceBundleID = useRef<string>(undefined);

  // effect to get the current bundle doc and bundle container
  useEffect(() => {
    async function getBundle() {
      if (!invoice) return;
      const bundle_ref = invoice?.data().credit_bundle_ref;
      if (!bundle_ref) {
        setCreditBundle(undefined);
        setBundleContainer(undefined);

        return;
      }

      await getDoc(bundle_ref).then(async (doc) => {
        setCreditBundle(doc);

        // get the bundle container
        const bundle_container_ref = doc.data()?.bundle_container_ref;
        if (!bundle_container_ref) return;

        await getDoc(bundle_container_ref).then((doc) => {
          setBundleContainer(doc);
        });
      });
    }

    if (invoiceBundleID.current === invoice?.data().credit_bundle_ref?.id)
      return;
    invoiceBundleID.current = invoice?.data().credit_bundle_ref?.id;

    getBundle();
  }, [invoice]);

  // effect to get the clients from the current bundle container in real time
  useEffect(() => {
    if (!bundleContainer) return;

    const coll = collection(
      bundleContainer.ref,
      SellersCollection.creditBundles.clients
    ) as CollectionReference<clientCreditBundleDocType>;

    const unsubcribe = onSnapshot(coll, (snap) => {
      setClients(snap.docs);
    });

    return () => {
      unsubcribe();
      setClients([]);
    };
  }, [bundleContainer]);

  // effect to get the previus bundle
  useEffect(() => {
    async function getPreviusBundle() {
      if (!creditBundle) return;
      const data = creditBundle.data();
      if (!data) return;
      const previus_bundle_ref = data.last_bundle;
      if (!previus_bundle_ref) return;

      await getDoc(previus_bundle_ref).then((doc) => {
        setPreviusCreditBundle(doc);
      });
    }

    getPreviusBundle();

    return () => {
      setPreviusCreditBundle(undefined);
    };
  }, [creditBundle]);

  // effect to get the current credits in realtime
  useEffect(() => {
    if (!creditBundle) return;

    const coll = collection(
      creditBundle.ref,
      SellersCollection.creditBundles.bundles.credits
    ) as CollectionReference<CreditInBundle>;

    const unsubcribe = onSnapshot(coll, (snap) => {
      setCurrentBundleCredits(snap.docs);
    });

    return () => {
      setCurrentBundleCredits([]);
      unsubcribe();
    };
  }, [creditBundle]);

  // effect to get the previus credits
  useEffect(() => {
    async function getPreviusCredits() {
      if (!previusCreditBundle) return;

      const coll = collection(
        previusCreditBundle.ref,
        SellersCollection.creditBundles.bundles.credits
      ) as CollectionReference<CreditInBundle>;

      const querySnapshot = await getDocs(coll);
      setPreviusBundleCredits(querySnapshot.docs);
    }

    getPreviusCredits();

    return () => {
      setPreviusBundleCredits([]);
    };
  }, [previusCreditBundle]);

  return {
    clients,
    creditBundle,
    bundleContainer,
    previusCreditBundle,
    currentBundleCredits,
    previusBundleCredits,
  };
}
