import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Button } from "@/styles/Form.styles";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { clientCredit } from "@/tools/sellers/credits/create";
import { useInvoice } from "@/contexts/InvoiceContext";
import { getCredits } from "@/tools/sellers/credits/get";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { CreditClient } from "./CreditClient";
import { CreditForm } from "./CreditForm";
import { CreditHeader } from "./CreditHeader";
import { Route } from "./Route";
import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";
import { rawCreditResult } from "@/pages/invoices/manage";

interface props {
  setRawCreditResult: Dispatch<SetStateAction<rawCreditResult>>;
  creditResult: number;
}

export function Credit({ setRawCreditResult, creditResult }: props) {
  const { invoice } = useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [lastRoute, setLastRoute] = useState(0);
  const [credits, setCredits] = useState<QueryDocumentSnapshot<clientCredit>[]>(
    []
  );

  useEffect(() => {
    const route = invoice?.data()?.route;
    const seller_ref = invoice?.data()?.seller_ref;
    if (!route || !seller_ref) return;
    if (route === lastRoute) return;
    setLastRoute(route);

    const cancelSubcription = getCredits(setCredits, route, seller_ref);

    return () => cancelSubcription();
  }, [invoice]);

  return (
    <Container styles={{ width: "50%", marginBottom: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Creditos</h2>
      <FlexContainer
        styles={{ justifyContent: "space-between", marginBottom: "20px" }}
      >
        <Route />
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Ocultar" : "Agregar nuevo"}
        </Button>
      </FlexContainer>
      {showForm && <CreditForm setShowForm={setShowForm} />}
      <Container>
        <CreditHeader />
        {credits.map((credit) => (
          <GridContainer
            key={credit.id}
            $gridTemplateColumns="repeat(4, 75px) 1fr"
          >
            <CreditClient
              clientCredit={credit}
              setRawCreditResult={setRawCreditResult}
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
