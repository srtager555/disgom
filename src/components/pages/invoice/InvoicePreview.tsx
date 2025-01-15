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

export const InvoiceContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 350px);
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

const ButtonBro = styled(Button)`
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

export function InvoicePreview({ doc }: props) {
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
          <small>
            {sellerData?.name} - {data.credit?.paid ? "pagado" : "en credito"}
          </small>
          <p>{client.data()?.name}</p>
        </Container>
      ) : (
        <p>{sellerData?.name}</p>
      )}
      <Container styles={{ height: "100%" }}>
        {numberParser(data.total_sold.withInventory)}
        {client ? (
          <ButtonBro
            $primary
            onClick={() => {
              router.push("/invoices/preview?id=" + doc.id);
            }}
          >
            Más
          </ButtonBro>
        ) : (
          <ButtonBro
            $primary
            onClick={() => {
              if (!data.inventory_ref) {
                router.push("/invoices/closing?id=" + doc.id);
              } else {
                router.push("/invoices/closed?id=" + doc.id);
              }
            }}
          >
            {!data.inventory_ref ? "Cierre" : "Más"}
          </ButtonBro>
        )}
      </Container>
    </InvoiceComponent>
  );
}
