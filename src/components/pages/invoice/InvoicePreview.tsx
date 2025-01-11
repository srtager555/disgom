import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import {
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

export const InvoiceContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 50px;
  gap: 10px;
`;

const InvoiceComponent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 10px;
  border: 1px solid ${globalCSSVars["--detail"]};
  border-radius: 10px;
`;

type props = {
  doc: QueryDocumentSnapshot<invoiceType>;
  inSeller?: boolean;
};

export function InvoicePreview({ doc }: props) {
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [client, setClient] = useState<DocumentSnapshot<client>>();
  const data = useMemo(() => doc.data(), [doc]);
  const sellerData = useMemo(() => seller?.data(), [seller]);

  // effect to get the seller
  useEffect(() => {
    async function getSeller() {
      const s = await getDoc(data.seller_ref);
      setSeller(s);
    }

    getSeller();
  }, [data.seller_ref]);

  // effect to get the client
  useEffect(() => {
    async function getSeller() {
      if (!data.client_ref) return;
      const c = await getDoc(data.client_ref);
      setClient(c);
    }

    getSeller();
  }, [data.client_ref]);

  return (
    <InvoiceComponent>
      {client ? (
        <Container>
          <small>{sellerData?.name}</small>
          <p>{client.data()?.name}</p>
        </Container>
      ) : (
        <p>{sellerData?.name}</p>
      )}
    </InvoiceComponent>
  );
}
