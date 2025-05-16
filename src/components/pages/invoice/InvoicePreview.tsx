import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container } from "@/styles/index.styles";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { numberParser } from "@/tools/numberPaser";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import {
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

export const InvoiceContainer = styled.div<{ small?: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    ${(props) => (props.small ? "2, 1fr" : "3, 350px")}
  );
  grid-auto-rows: 50px;
  gap: 10px;
`;

const InvoiceComponent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-left: 10px;
  border: 1px solid ${globalCSSVars["--detail"]};
  border-radius: 10px;
  overflow: hidden;
`;

const AnchorBro = styled.a`
  display: inline-flex;
  align-items: center;
  background-color: ${globalCSSVars["--highlight"]};
  height: 100%;
  border: none;
  border-radius: 0px;
  padding: 0px 10px;
  margin-left: 10px;
`;

type props = {
  doc: QueryDocumentSnapshot<invoiceType>;
  inSeller?: boolean;
};

export function InvoicePreview({ doc, inSeller }: props) {
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [client, setClient] = useState<DocumentSnapshot<client>>();
  const data = useMemo(() => doc.data(), [doc]);
  const sellerData = useMemo(() => seller?.data(), [seller]);
  const router = useRouter();

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
    async function getClient() {
      if (!data.client_ref) return;
      const c = await getDoc(data.client_ref);
      setClient(c);
    }

    getClient();
  }, [data.client_ref]);

  // Determine what to display based on invoice type and context
  const primaryDisplay = useMemo(() => {
    if (!client) {
      switch (data.invoice_type) {
        case "donation":
          return "Donación"; // Spanish for donation
        case "damaged":
          return "Dañado"; // Spanish for damaged
        default:
          // For 'normal' or any other type, show the seller name
          return sellerData?.name;
      }
    } else {
      return client?.data()?.name;
    }
  }, [data.invoice_type, sellerData?.name, client]);

  return (
    <InvoiceComponent>
      {client ? (
        <Container>
          <small>
            {primaryDisplay} - {data.credit?.paid ? "pagado" : "en credito"}
          </small>
          <p>{client.data()?.name}</p>
        </Container>
      ) : inSeller ? (
        <p style={{ textOverflow: "ellipsis" }}>
          {data.created_at?.toDate().toLocaleDateString()}
        </p>
      ) : (
        <p style={{ textOverflow: "ellipsis" }}>{primaryDisplay}</p> // Use the determined display value
      )}
      <Container styles={{ height: "100%" }}>
        {numberParser(data.total_sold)}
        {client ? (
          <AnchorBro href={"/invoices/preview?id=" + doc.id}>Más</AnchorBro>
        ) : (
          <AnchorBro href={"/invoices/manage?id=" + doc.id}>Ver más</AnchorBro>
        )}
      </Container>
    </InvoiceComponent>
  );
}
