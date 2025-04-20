import { useInvoice } from "@/contexts/InvoiceContext";
import { Container, FlexContainer } from "@/styles/index.styles";
import { useEffect, useState, useRef } from "react";
import { DocumentReference, getDoc, updateDoc } from "firebase/firestore";
import { client } from "@/tools/sellers/createClient";
import styled from "styled-components";
import { Button } from "@/styles/Form.styles";
import { debounce } from "lodash";

const CustomContainer = styled(Container)`
  width: 50%;

  & p {
    margin-bottom: 10px;
  }
`;

export function Preliminar() {
  const { invoice } = useInvoice();
  const [clientData, setClientData] = useState<client | null>(null);
  const clientRef = useRef<DocumentReference<client>>(null);
  const debouncedDelete = debounce(handleDelete, 5000);

  async function handleDelete() {
    console.log("Deleting...");

    if (!invoice) return;

    await updateDoc(invoice.ref, {
      disabled: true,
      deleted_at: new Date(),
    });
  }

  const handleMouseUp = () => {
    debouncedDelete.cancel();
  };

  const handleMouseDown = () => {
    debouncedDelete();
  };

  useEffect(() => {
    const getClientData = async () => {
      if (!invoice) return;

      if (clientRef.current === invoice.data()?.client_ref) return;
      clientRef.current = invoice.data()?.client_ref;

      const { client_ref } = invoice.data() ?? {};
      if (!client_ref) return;

      const clientDoc = await getDoc(client_ref);
      if (!clientDoc.exists()) return;

      const data = clientDoc.data();
      setClientData(data);
    };

    getClientData();
  }, [invoice]);

  return (
    <FlexContainer
      styles={{
        width: "100%",
        marginTop: "30px",
        justifyContent: "space-between",
      }}
    >
      <CustomContainer styles={{ width: "50%" }}>
        <h2>Información preliminar</h2>
        <p>Nombre: {clientData?.name}</p>
        <p>Dirección: {clientData?.address}</p>
        <p>Numero de teléfono: {clientData?.phone_number}</p>
      </CustomContainer>
      <FlexContainer styles={{ gap: "10px", alignItems: "flex-start" }}>
        <Button onClick={() => window.print()}>Imprimir</Button>
        <Button
          $warn
          $hold
          onMouseUp={handleMouseUp}
          onMouseDown={handleMouseDown}
        >
          ELIMINAR
        </Button>
      </FlexContainer>
    </FlexContainer>
  );
}
