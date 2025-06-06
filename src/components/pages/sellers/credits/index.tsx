import { Container, FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { SelectCreditBundleToShow } from "./SelectCreditBundleToShow";
import { creditBundleContainerDoc } from "@/tools/sellers/credits/createBundle";
import { useEffect, useState } from "react";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { clientCreditBundleDocType } from "@/tools/sellers/credits/createClientForABundle";
import {
  analyzeCreditSnapshots,
  AnalyzedCreditItem,
} from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { CreditInBundle } from "@/tools/sellers/credits/createOrUpdateCreditInBundle";
import { numberParser } from "@/tools/numberPaser";
import { ClientCredit } from "./ClientCredit";

interface props {
  seller_doc: DocumentSnapshot<SellersDoc>;
}

export function SellerCredit({ seller_doc }: props) {
  const [bundleCreditsToShow, setBundleCreditsToShow] =
    useState<DocumentReference<creditBundleContainerDoc> | null>(null);
  const [container, setContainer] = useState<
    DocumentSnapshot<creditBundleContainerDoc> | undefined
  >();
  const [rawCredits, setRawCredits] = useState<
    QueryDocumentSnapshot<CreditInBundle>[]
  >([]);
  const [analyzedCredits, setAnalyzedCredits] = useState<AnalyzedCreditItem[]>(
    []
  );
  const [clients, setClients] = useState<
    QueryDocumentSnapshot<clientCreditBundleDocType>[]
  >([]);
  const [totalCreditAmount, setTotalCreditAmount] = useState(0);

  // effect to get the container
  useEffect(() => {
    async function getContainer() {
      if (!bundleCreditsToShow) return;

      const container = await getDoc(bundleCreditsToShow);
      setContainer(container);
    }

    getContainer();
  }, [bundleCreditsToShow]);

  // effect to get the credits in the selected bundle
  useEffect(() => {
    async function getCredits() {
      if (!container) return setRawCredits([]);
      const container_data = container.data();
      if (!container_data) return;
      if (!container_data.current_free_bundle) return;

      const coll = collection(
        container_data.current_free_bundle,
        SellersCollection.creditBundles.bundles.credits
      ) as CollectionReference<CreditInBundle>;

      await getDocs(coll).then((snap) => {
        setRawCredits(snap.docs);
      });
    }

    getCredits();

    return () => {
      setRawCredits([]);
    };
  }, [container]);

  // effect to get the clients
  useEffect(() => {
    async function getClients() {
      if (!container) return;

      const coll = collection(
        container.ref,
        SellersCollection.creditBundles.clients
      ) as CollectionReference<clientCreditBundleDocType>;

      const clients = await getDocs(coll);
      setClients(clients.docs);
    }

    getClients();
  }, [container]);

  // effect to analyze the credits btw, I hate this project
  useEffect(() => {
    const result = analyzeCreditSnapshots(rawCredits, [], clients);

    setAnalyzedCredits(result.credits_list);
    setTotalCreditAmount(result.total_current_bundle_credit);
  }, [clients, rawCredits]);

  return (
    <Container>
      <FlexContainer
        styles={{
          justifyContent: "space-between",
          gap: "20px",
          minWidth: "50%",
        }}
      >
        <h2>
          Creditos{" "}
          {totalCreditAmount > 0 && `${numberParser(totalCreditAmount)}`}
        </h2>
        <SelectCreditBundleToShow
          seller_ref={seller_doc.ref}
          setBundleCreditsToShow={setBundleCreditsToShow}
        />
      </FlexContainer>
      <Container
        styles={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          justifyContent: "flex-start",
          gap: "20px",
          width: "100%",
        }}
      >
        {analyzedCredits.map((credit, i) => {
          return <ClientCredit key={i} data={credit} />;
        })}
      </Container>
    </Container>
  );
}
