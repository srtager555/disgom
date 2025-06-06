import {
  creditBundle,
  creditBundleContainerDoc,
} from "@/tools/sellers/credits/createBundle";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Days } from "../../invoice/manage/Closing/Data";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import {
  collection,
  CollectionReference,
  query,
  where,
  onSnapshot,
  getDoc,
  DocumentReference,
  DocumentSnapshot,
} from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";
import { Container } from "@/styles/index.styles";
import { Select } from "@/components/Inputs/select";

interface props {
  seller_ref: DocumentReference<SellersDoc>;
  setBundleCreditsToShow: Dispatch<
    SetStateAction<DocumentReference<creditBundleContainerDoc> | null>
  >;
}

export function SelectCreditBundleToShow({
  seller_ref,
  setBundleCreditsToShow,
}: props) {
  const [availableBundles, setAvailableBundles] = useState<
    DocumentSnapshot<creditBundle>[]
  >([]);
  const [bundleContainersList, setBundleContainersList] = useState<
    Record<string, DocumentReference<creditBundleContainerDoc>>
  >({});

  const selectOptions = useMemo(() => {
    const bundleOptions = availableBundles.map((bundleDoc) => {
      const bundleData = bundleDoc.data() as creditBundle;
      const bundleDate = bundleData.created_at.toDate().toLocaleDateString();
      const bundleDay = Days[bundleData.created_at.toDate().getDay()];

      const displayName = `Lista del ${bundleDay} ${bundleDate}${
        process.env.NODE_ENV === "development"
          ? ` (${bundleDoc.id.substring(0, 5)})`
          : ""
      }`;
      return {
        name: displayName,
        value: bundleDoc.id,
      };
    });

    return [{ name: "Seleccionar lista", value: "" }, ...bundleOptions];
  }, [availableBundles]);

  function handlerSelectOnChange(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      setBundleCreditsToShow(null);
      return;
    }

    const bundleContainerRef = bundleContainersList[id];
    setBundleCreditsToShow(bundleContainerRef);
  }

  // effect to get the available bundles
  useEffect(() => {
    // Asumiendo que 'creditBundles' es una subcolección de 'sellers'
    const bundlesContainerCollRef = collection(
      seller_ref,
      SellersCollection.creditBundles.root
    ) as CollectionReference<creditBundleContainerDoc>;

    const q = query(
      bundlesContainerCollRef,
      where("current_free_bundle", "!=", null),
      where("disabled", "==", false)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const availableBundles = querySnapshot.docs.map(async (doc) => {
        const freeBundle = await getDoc(
          doc.data().current_free_bundle as DocumentReference<creditBundle>
        );

        setBundleContainersList((prev) => ({
          ...prev,
          [freeBundle.id]: doc.ref,
        }));

        return freeBundle;
      });

      setAvailableBundles(await Promise.all(availableBundles));
    });

    return () => {
      unsubscribe();
    };
  }, [seller_ref]);

  return (
    <Container>
      <Select options={selectOptions} onChange={handlerSelectOnChange} />
    </Container>
  );
}
