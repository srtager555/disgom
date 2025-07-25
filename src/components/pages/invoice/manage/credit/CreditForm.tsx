import { InputNumber } from "@/components/Inputs/number";
import { InputText } from "@/components/Inputs/text";
import { useInvoice } from "@/contexts/InvoiceContext";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { Form, Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import {
  creditBundle,
  creditBundleContainerDoc,
} from "@/tools/sellers/credits/createBundle";
// import { createClientCredit } from "@/tools/sellers/credits/create";
import { createAClientForABundle } from "@/tools/sellers/credits/createClientForABundle";
import { createOrUpdateCreditInBundle } from "@/tools/sellers/credits/createOrUpdateCreditInBundle";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { useRef } from "react";

export const CreditForm = ({
  bundleContainerRef,
  bundleSnap,
}: {
  bundleContainerRef: DocumentReference<creditBundleContainerDoc>;
  bundleSnap: DocumentSnapshot<creditBundle>;
}) => {
  const { invoice } = useInvoice();
  const { checkHasNextInvoiceCreditSection } = useHasNextInvoice();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const seller_ref = invoice?.data()?.seller_ref;

    if (!seller_ref) return;

    const target = e.target as HTMLFormElement & {
      creditName: HTMLInputElement;
      amount: HTMLInputElement;
    };
    // const creditName = target.creditName.value;
    const amount = target.amount.value;
    const bundle_ref = invoice.data().credit_bundle_ref;

    if (!bundle_ref) return;

    const client_ref = await createAClientForABundle(bundleContainerRef, {
      // name: creditName,
      address: "not provided",
    });

    await checkHasNextInvoiceCreditSection(
      bundleSnap,
      async () =>
        await createOrUpdateCreditInBundle({
          bundle_ref,
          client_ref,
          amount: 0,
          create_previus_amount: Number(amount),
        })
    );

    // await createClientCredit(
    //   route,
    //   seller_ref,
    //   creditName,
    //   Number(amount),
    //   "not provided",
    //   invoice.ref
    // );

    formRef.current?.reset();
  };

  if (!invoice?.data().credit_bundle_ref) {
    return <p>Seleccione o cree una lista de creditos</p>;
  }

  return (
    <Form
      ref={formRef}
      style={{ marginBottom: "30px" }}
      onSubmit={handleSubmit}
    >
      <FlexContainer styles={{ justifyContent: "center" }}>
        <Container>
          <h3>Agregue un nuevo credito</h3>
          {/* <p>Agregue un nuevo credito</p> */}
          <FlexContainer styles={{ gap: "10px", marginBottom: "10px" }}>
            {/* <InputText
          type="text"
          placeholder="Nombre"
          marginBottom="0px"
          name="creditName"
        /> */}
            <InputNumber
              typeText
              placeholder="Credito previo"
              marginBottom="0px"
              name="amount"
            />
          </FlexContainer>
          <Button>Agregar</Button>
        </Container>
      </FlexContainer>
    </Form>
  );
};
