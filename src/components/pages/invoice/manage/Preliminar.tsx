import { useInvoice } from "@/contexts/InvoiceContext";
import { Container, FlexContainer } from "@/styles/index.styles";
import { useEffect, useState, useRef } from "react";
import { DocumentReference, getDoc } from "firebase/firestore";
import { client } from "@/tools/sellers/createClient";
import styled from "styled-components";

const CustomContainer = styled(Container)`
  width: 100%;

  & p {
    margin-bottom: 10px;
  }
`;

export function Preliminar() {
  const { invoice } = useInvoice();
  const [clientData, setClientData] = useState<client | null>(null);
  const clientRef = useRef<DocumentReference<client>>(null);

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
      <CustomContainer>
        <h2>Información preliminar</h2>
        <p>Nombre: {clientData?.name}</p>
        <p>Dirección: {clientData?.address}</p>
        <p>Numero de teléfono: {clientData?.phone_number}</p>
      </CustomContainer>
    </FlexContainer>
  );
}
