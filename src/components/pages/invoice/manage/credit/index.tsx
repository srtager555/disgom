import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Button } from "@/styles/Form.styles";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { clientCredit } from "@/tools/sellers/credits/create";
import { useInvoice } from "@/contexts/InvoiceContext";
import {
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
  collection,
} from "firebase/firestore";
import { CreditClient } from "./CreditClient";
import { CreditForm } from "./CreditForm";
import { CreditHeader } from "./CreditHeader";
import { Route } from "./Route";
import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";
import { rawCreditResult } from "@/pages/invoices/manage";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { analyzeCreditSnapshots } from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { clientCreditBundleDocType } from "@/tools/sellers/credits/createClientForABundle";
import { creditBundle } from "@/tools/sellers/credits/createBundle";
import { useGetCreditBundleBasicData } from "@/hooks/sellers/getCreditBundleBasicData";

interface props {
  setCreditResult: Dispatch<SetStateAction<number>>;
  creditResult: number;
}

export function Credit({ setCreditResult, creditResult }: props) {
  const { invoice } = useInvoice();
  const {
    clients,
    creditBundle,
    bundleContainer,
    previusCreditBundle,
    currentBundleCredits,
    previusBundleCredits,
  } = useGetCreditBundleBasicData();
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<QueryDocumentSnapshot<clientCredit>[]>(
    []
  );

  // effect to get analize the credits
  useEffect(() => {
    const results = analyzeCreditSnapshots(
      currentBundleCredits,
      previusBundleCredits,
      clients
    );

    setCreditResult(
      results.total_current_bundle_credit - results.total_previous_bundle_credit
    );
  }, [clients, currentBundleCredits, previusBundleCredits, setCreditResult]);

  return (
    <Container styles={{ width: "50%", marginBottom: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Creditos</h2>

      <Route />
      <FlexContainer
        styles={{ justifyContent: "center", marginBottom: "10px" }}
      >
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Ocultar" : "Agregar nuevo"}
        </Button>
      </FlexContainer>
      {showForm && bundleContainer && (
        <CreditForm
          bundleContainerRef={bundleContainer.ref}
          setShowForm={setShowForm}
        />
      )}
      <Container>
        <CreditHeader />
        {credits.map((credit) => (
          <GridContainer
            key={credit.id}
            $gridTemplateColumns="repeat(4, 75px) 1fr"
          >
            <CreditClient
              clientCredit={credit}
              setRawCreditResult={setCreditResult}
            />
          </GridContainer>
        ))}
        <GridContainer $gridTemplateColumns="repeat(4, 75px) 1fr">
          <Column gridColumn="-2 / -3">Total</Column>
          <Column gridColumn="-1 / -2">{numberParser(creditResult)}</Column>
        </GridContainer>
      </Container>
    </Container>
  );
}
