import { InputText } from "@/components/Inputs/text";
import { useInvoice } from "@/contexts/InvoiceContext";
import { Form, Button } from "@/styles/Form.styles";
import { FlexContainer } from "@/styles/index.styles";
import { createClientCredit } from "@/tools/sellers/credits/create";
import { Dispatch, SetStateAction, useRef } from "react";

export const CreditForm = ({
  setShowForm,
}: {
  setShowForm: Dispatch<SetStateAction<boolean>>;
}) => {
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
    const amount = 0;
    //  target.amount.value;

    await createClientCredit(
      route,
      seller_ref,
      creditName,
      Number(amount),
      "not provided",
      invoice.ref
    );

    formRef.current?.reset();
    setShowForm(false);
  };

  if (!invoice?.data().route) {
    return <p>Agregue una ruta primero</p>;
  }

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
        {/* <InputNumber
          type="number"
          placeholder="Monto"
          marginBottom="0px"
          name="amount"
        /> */}
      </FlexContainer>
      <Button>Agregar</Button>
    </Form>
  );
};
