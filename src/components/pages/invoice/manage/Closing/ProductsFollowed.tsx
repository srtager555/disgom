import { Container, GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Firestore } from "@/tools/firestore";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { outputType } from "@/tools/products/addOutputs";
import { numberParser } from "@/tools/numberPaser";
import { getCurrentWeekRange } from "@/tools/time/current";
import { useInvoice } from "@/contexts/InvoiceContext";
import { Days } from "./Data";

const GridSizes = "100px 75px";

export function ProductsFollowed() {
  const { invoice } = useInvoice();
  const [invoices, setInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);
  const [totalCommission, setTotalCommission] = useState<
    Record<string, number>
  >({});
  const totalCommissionReduced = useMemo(
    () => Object.values(totalCommission).reduce((acc, now) => acc + now, 0),
    [totalCommission]
  );

  useEffect(() => {
    const time = getCurrentWeekRange(invoice?.data().created_at?.toDate());
    const db = Firestore();
    const coll = collection(
      db,
      InvoiceCollection.root
    ) as CollectionReference<invoiceType>;
    const q = query(
      coll,
      where("created_at", ">", time.start),
      where("created_at", "<", time.end)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      setInvoices(snap.docs);
    });

    return () => {
      unsubcribe();
    };
  }, []);

  return (
    <Container styles={{ width: "177px" }}>
      <GridContainer $gridTemplateColumns={GridSizes}>
        <Column gridColumn="span 2">Comisiones seguidas</Column>
      </GridContainer>
      {invoices.map((invoice, index) => (
        <ProductFolledTotalAmount
          key={index}
          invoice={invoice}
          setTotalCommission={setTotalCommission}
        />
      ))}
      <GridContainer $gridTemplateColumns={GridSizes}>
        <Column>Total</Column>
        <Column>{numberParser(totalCommissionReduced)}</Column>
      </GridContainer>
    </Container>
  );
}

function ProductFolledTotalAmount({
  invoice,
  setTotalCommission,
}: {
  invoice: QueryDocumentSnapshot<invoiceType>;
  setTotalCommission: Dispatch<SetStateAction<Record<string, number>>>;
}) {
  const [invoiceCommission, setInvoiceCommission] = useState(0);

  useEffect(() => {
    const coll = collection(
      invoice.ref,
      "outputs_sold"
    ) as CollectionReference<outputType>;
    const q = query(
      coll,
      where("followed", "==", true),
      where("amount", ">", 0),
      where("disabled", "==", false)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      const totalCommision = snap.docs.reduce((acc, now) => {
        return acc + now.data().commission_value;
      }, 0);

      setTotalCommission((prev) => ({
        ...prev,
        [invoice.id]: totalCommision,
      }));
      setInvoiceCommission(totalCommision);
    });

    return () => {
      unsubcribe();
    };
  }, []);

  return (
    <GridContainer $gridTemplateColumns={GridSizes}>
      <Column title={invoice.data().created_at?.toDate().toLocaleDateString()}>
        {Days[invoice.data().created_at?.toDate().getDay() ?? 0]}
      </Column>
      <Column>{numberParser(invoiceCommission)}</Column>
    </GridContainer>
  );
}
