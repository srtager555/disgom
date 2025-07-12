import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Button } from "@/styles/Form.styles";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { CreditClient } from "./CreditClient";
import { CreditForm } from "./CreditForm";
import { CreditHeader } from "./CreditHeader";
import { Route } from "./Route";
import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";
import {
  analyzeCreditSnapshots,
  AnalyzedCreditItem,
} from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { useGetCreditBundleBasicData } from "@/hooks/sellers/getCreditBundleBasicData";

interface props {
  setCreditResult: Dispatch<SetStateAction<number>>;
  creditResult: number;
}

export function Credit({ setCreditResult, creditResult }: props) {
  const {
    clients,
    creditBundle,
    bundleContainer,
    // previusCreditBundle,
    currentBundleCredits,
    previusBundleCredits,
  } = useGetCreditBundleBasicData();
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<AnalyzedCreditItem[]>([]);

  // effect to get analize the credits
  useEffect(() => {
    const results = analyzeCreditSnapshots(
      currentBundleCredits,
      previusBundleCredits,
      clients
    );

    setCreditResult(
      results.total_previous_bundle_credit - results.total_current_bundle_credit
    );
    setCredits(results.credits_list);
  }, [clients, currentBundleCredits, previusBundleCredits, setCreditResult]);

  return (
    <Container styles={{ width: "50%", marginBottom: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Creditos</h2>

      <Route />
      {bundleContainer && creditBundle && (
        <FlexContainer
          className="hide-print"
          styles={{ justifyContent: "center", marginBottom: "10px" }}
        >
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Ocultar" : "Agregar nuevo"}
          </Button>
        </FlexContainer>
      )}
      {showForm && bundleContainer && creditBundle && (
        <CreditForm
          bundleContainerRef={bundleContainer.ref}
          setShowForm={setShowForm}
          bundleSnap={creditBundle}
        />
      )}
      <Container>
        <CreditHeader />
        {creditBundle &&
          credits.map((credit, i) => (
            <GridContainer key={i} $gridTemplateColumns="repeat(4, 75px) 1fr">
              <CreditClient credit={credit} bundleSnap={creditBundle} />
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
