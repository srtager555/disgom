import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column, Input } from "../../Product";
import { Button, Form } from "@/styles/Form.styles";
import { useState, useRef, useEffect } from "react";
import { InputText } from "@/components/Inputs/text";
import { InputNumber } from "@/components/Inputs/number";
import {
  clientCredit,
  createClientCredit,
  createCredit,
  credit,
} from "@/tools/sellers/credits/create";
import { useInvoice } from "@/contexts/InvoiceContext";
import { getClientCredits, getCredits } from "@/tools/sellers/credits/get";
import { DocumentSnapshot, getDoc } from "firebase/firestore";
import { numberParser } from "@/tools/numberPaser";

export function Credit() {
  const { invoice } = useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<DocumentSnapshot<clientCredit>[]>([]);

  useEffect(() => {
    const getTheCredits = async () => {
      // if (!refreshCredits) return;
      // setRefreshCredits(false);

      const route = invoice?.data()?.route;
      const seller_ref = invoice?.data()?.seller_ref;
      if (!route || !seller_ref) return;

      const credits = await getCredits(route, seller_ref);
      setCredits(credits.docs);
    };

    getTheCredits();
  }, [invoice]);

  return (
    <Container styles={{ width: "49%" }}>
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

const CreditClient = ({
  clientCredit,
}: {
  clientCredit: DocumentSnapshot<clientCredit>;
}) => {
  const [currentCredit, setCurrentCredit] = useState<
    DocumentSnapshot<credit> | undefined
  >(undefined);
  const [clientLastCredit, setClientLastCredit] =
    useState<DocumentSnapshot<credit>>();
  const [amount, setAmount] = useState(0);
  const [diff, setDiff] = useState(0);
  const { invoice } = useInvoice();

  // effect to create the new credit
  useEffect(() => {
    const getCredit = async () => {
      const lastCredit = await getClientCredits(clientCredit.ref);
      setClientLastCredit(lastCredit);

      if (!invoice) return;
      // logic to search if the new creadit already created
      const newCreditsArray = invoice.data().newCredits || [];
      const isThere = newCreditsArray.find(
        (ref) => ref.parent.parent?.id === clientCredit.id
      );

      if (isThere) {
        const current = await getDoc(isThere);
        setCurrentCredit(current);
      }

      const newCurrentRef = await createCredit({
        amount,
        client_ref: clientCredit.ref,
        last_amount: lastCredit?.data().amount || null,
        last_credit: lastCredit?.ref || null,
        next_credit: null,
        invoice_ref: invoice.ref,
        seller_ref: invoice.data().seller_ref,
      });

      const newCurrent = await getDoc(newCurrentRef);

      setCurrentCredit(newCurrent);
    };
    getCredit();
  }, [clientCredit]);

  useEffect(() => {
    const last = clientLastCredit?.data()?.amount || 0;

    setDiff(last - amount);
  }, [clientLastCredit, amount]);

  // effect to save the new credits
  // useEffect(() => {
  //   const credits = invoice?.data().newCredits
  //   if (!credits) return;

  //   const creditsIDs = credits.map(el => el.parent.parent?.id)
  //   const currentCredit = creditsIDs.find((el) => )
  // }, [])

  // effect to save the new credit
  useEffect(() => {
    const saveCredit = async () => {
      if (!invoice || !clientLastCredit) return;
      const last_amount = clientLastCredit?.data()?.amount || 0;
      const last_ref = clientLastCredit?.ref;
      const invo_ref = invoice.ref;
      const seller_ref = invoice.data().seller_ref;

      await createCredit({
        amount,
        client_ref: clientCredit.ref,
        last_amount: last_amount,
        last_credit: last_ref,
        next_credit: null,
        invoice_ref: invo_ref,
        seller_ref: seller_ref,
      });
    };

    saveCredit();
  }, [amount]);

  return (
    <>
      <Column gridColumn="1 / 3">{clientCredit.data()?.name}</Column>
      <Column>{numberParser(clientLastCredit?.data()?.amount || 0)}</Column>
      <Column>
        <Input
          type="number"
          value={amount}
          name="amount"
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </Column>
      <Column>{numberParser(diff)}</Column>
    </>
  );
};

const CreditForm = () => {
  const { invoice } = useInvoice();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const route = invoice?.data()?.route;
    const seller_ref = invoice?.data()?.seller_ref;
    if (!route || !seller_ref) return;

    const target = e.target as HTMLFormElement & {
      creditName: HTMLInputElement;
      amount: HTMLInputElement;
    };
    const creditName = target.creditName.value;
    const amount = target.amount.value;

    await createClientCredit(
      route,
      seller_ref,
      creditName,
      Number(amount),
      "not provided",
      invoice.ref
    );

    formRef.current?.reset();
  };

  return (
    <Form
      ref={formRef}
      style={{ marginBottom: "30px" }}
      onSubmit={handleSubmit}
    >
      <h3>Agregar nuevo credito</h3>
      <p>Agregue un nuevo credito</p>
      <FlexContainer styles={{ gap: "10px", marginBottom: "10px" }}>
        <InputText
          type="text"
          placeholder="Nombre"
          marginBottom="0px"
          name="creditName"
        />
        <InputNumber
          type="number"
          placeholder="Monto"
          marginBottom="0px"
          name="amount"
        />
      </FlexContainer>
      <Button>Agregar</Button>
    </Form>
  );
};

const CreditHeader = () => (
  <GridContainer grisTemplateColumns="repeat(4, 75px) 1fr">
    <Column gridColumn="1 / 3">Nombre</Column>
    <Column>Cobros</Column>
    <Column>Creditos</Column>
    <Column title="Diferencias">Diferencias</Column>
  </GridContainer>
);
