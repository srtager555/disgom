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

interface props {
  setRawCreditResult: Dispatch<SetStateAction<rawCreditResult>>;
  creditResult: number;
}

export function Credit({ setRawCreditResult, creditResult }: props) {
  const { invoice } = useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<QueryDocumentSnapshot<clientCredit>[]>(
    []
  );

  useEffect(() => {
    const route = invoice?.data()?.route;
    const seller_ref = invoice?.data()?.seller_ref;

    if (!route || !seller_ref) return;
    let unsubcribe = () => {};

    const creditColl = collection(
      seller_ref,
      SellersCollection.credits
    ) as CollectionReference<clientCredit>;

    const q = query(creditColl, where("route", "==", route));

    unsubcribe = onSnapshot(q, (snap) => {
      setCredits(snap.docs);
    });

    return () => unsubcribe();
  }, [invoice]);

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
