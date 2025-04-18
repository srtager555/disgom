import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Button } from "@/styles/Form.styles";
import { useState, useEffect } from "react";
import { clientCredit } from "@/tools/sellers/credits/create";
import { useInvoice } from "@/contexts/InvoiceContext";
import { getCredits } from "@/tools/sellers/credits/get";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { CreditClient } from "./CreditClient";
import { CreditForm } from "./CreditForm";
import { CreditHeader } from "./CreditHeader";

export function Credit() {
  const { invoice } = useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<QueryDocumentSnapshot<clientCredit>[]>(
    []
  );

  useEffect(() => {
    const route = invoice?.data()?.route;
    const seller_ref = invoice?.data()?.seller_ref;
    if (!route || !seller_ref) return;

    const cancelSubcription = getCredits(setCredits, route, seller_ref);

    return () => cancelSubcription();
  }, [invoice]);

  return (
    <Container styles={{ width: "48%", marginRight: "2%" }}>
      <FlexContainer
        styles={{ justifyContent: "space-between", marginBottom: "20px" }}
      >
        <h2>Creditos</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Ocultar" : "Agregar nuevo"}
        </Button>
      </FlexContainer>
      {showForm && <CreditForm />}
      <CreditHeader />
      <GridContainer grisTemplateColumns="repeat(4, 75px) 1fr">
        {credits.map((credit) => (
          <CreditClient key={credit.id} clientCredit={credit} />
        ))}
      </GridContainer>
    </Container>
  );
}
