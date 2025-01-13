import { ProductClosing } from "@/components/pages/invoice/Product/closing";
import useQueryParams from "@/hooks/getQueryParams";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const invoiceData = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);
  const sellerData = useMemo(() => seller?.data(), [seller]);

  useEffect(() => {
    async function getInvoice() {
      if (!id) return;

      const db = Firestore();
      const docRef = doc(
        db,
        InvoiceCollection.root,
        id
      ) as DocumentReference<invoiceType>;
      const inv = await getDoc(docRef);

      setInvoiceDoc(inv);
    }

    getInvoice();
  }, [id]);

  // effect to get the seller
  useEffect(() => {
    async function getOwners() {
      if (!invoiceData) return;

      const seller = await getDoc(invoiceData.seller_ref);

      setSeller(seller);
    }

    getOwners();
  }, [invoiceData]);

  if (!invoiceDoc || !invoiceData || !sellerData) return "Cargando...";

  return (
    <Container>
      <Head>
        <title>
          {sellerData.name} cierre{" "}
          {invoiceData.created_at.toDate().toLocaleDateString()}
        </title>
      </Head>
      <Container styles={{ marginBottom: "20px" }}>
        <h1>Cierre de {sellerData.name}</h1>
        <p>Cierre del {invoiceData.created_at.toDate().toLocaleDateString()}</p>
      </Container>
      <ProductClosing invoiceDoc={invoiceDoc} />
    </Container>
  );
}
