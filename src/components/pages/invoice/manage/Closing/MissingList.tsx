import { invoiceType } from "@/tools/invoices/createInvoice";
import { Container, GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { useInvoice } from "@/contexts/InvoiceContext";
import { numberParser } from "@/tools/numberPaser";
import { Button } from "@/styles/Form.styles";
import { debounce } from "lodash";

const gridTemplateColumns = "100px 98px";

export function MissingList() {
  const [docs, setDocs] = useState<QueryDocumentSnapshot<invoiceType>[]>([]);
  const { invoice } = useInvoice();

  async function checkAllHandler() {
    const arr = docs.map(async (doc) => {
      await updateDoc(doc.ref, {
        "diff.paid": true,
        "diff.paid_at": new Date(),
      });
    });

    await Promise.all(arr);
  }

  const debounceCheckAll = debounce(checkAllHandler, 5000);

  const total = useMemo(() => {
    return docs.reduce((before, now) => {
      if (now.data().diff.amount < 0) {
        return before + now.data().diff.amount;
      }
      return before;
    }, 0);
  }, [docs]);

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      InvoiceCollection.root
    ) as CollectionReference<invoiceType>;

    const q = query(
      coll,
      where("diff.amount", "<", 0),
      where("diff.paid", "==", false)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      console.log("aaaa", snap.docs);
      setDocs(snap.docs);
    });

    return () => {
      unsubcribe();
    };
  }, [invoice]);

  if (!invoice)
    return (
      <Container styles={{ width: "200px" }}>
        <p>Cargando...</p>
      </Container>
    );

  return (
    <Container styles={{ width: "200px" }}>
      <Container>
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column gridColumn="1 / 3">Faltantes</Column>
        </GridContainer>
        {docs.length === 0 ? (
          <GridContainer $gridTemplateColumns={gridTemplateColumns}>
            <Column gridColumn="span 2">No hay faltantes</Column>
          </GridContainer>
        ) : (
          docs.map((doc) => (
            <GridContainer
              key={doc.id}
              $gridTemplateColumns={gridTemplateColumns}
            >
              <Column>
                {doc
                  .data()
                  .created_at?.isEqual(
                    invoice.data().created_at as unknown as Timestamp
                  )
                  ? "Esta factura"
                  : doc.data().created_at?.toDate().toLocaleDateString()}
              </Column>
              <Column>{numberParser(doc.data().diff.amount)}</Column>
            </GridContainer>
          ))
        )}
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column>Total</Column>
          <Column>{numberParser(total)}</Column>
        </GridContainer>
      </Container>
      <Container styles={{ fontSize: "0.8rem", marginTop: "10px" }}>
        {docs.length > 0 && (
          <Button
            onMouseDown={() => {
              debounceCheckAll();
            }}
            onMouseUp={() => {
              debounceCheckAll.cancel();
            }}
            $hold
            $primary
          >
            Marcar todos como pagados
          </Button>
        )}
      </Container>
    </Container>
  );
}
