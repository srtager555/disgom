import { invoiceType } from "@/tools/invoices/createInvoice";
import { Container, GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  CollectionReference,
  DocumentReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { useInvoice } from "@/contexts/InvoiceContext";
import { numberParser } from "@/tools/numberPaser";
import { Button } from "@/styles/Form.styles";
import { debounce } from "lodash";
import { Days } from "./Data";
import styled from "styled-components";
import { globalCSSVars } from "@/styles/colors";

const gridTemplateColumns = "100px 98px";

const HideButton = styled(Button)`
  display: block;
  position: absolute;
  top: -1px;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  opacity: 0;
  border: none;
  border-radius: 0;
  background-color: ${globalCSSVars["--background"]};
  text-decoration: underline;

  &:hover {
    opacity: 1;
  }
`;

export function MissingList() {
  const [docs, setDocs] = useState<QueryDocumentSnapshot<invoiceType>[]>([]);
  const { invoice } = useInvoice();

  async function checkAllHandler() {
    try {
      const batch = writeBatch(Firestore());

      docs.forEach((doc) => {
        batch.update(doc.ref, {
          "diff.paid": true,
          "diff.paid_at": new Date(),
        });
      });

      console.log("Setting each invoice has paid");
      await batch.commit();
    } catch (error) {
      console.error("Atomic operation failed");
      console.error(error);
    }
  }

  async function checkOneHandler(ref: DocumentReference<invoiceType>) {
    try {
      await updateDoc(ref, {
        "diff.paid": true,
        "diff.paid_at": new Date(),
      });
    } catch (error) {
      console.error("Paid operation failed");
      console.error(error);
    }
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
      where("diff.paid", "==", false),
      where("disabled", "==", false),
      where("seller_ref", "==", invoice?.data().seller_ref)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      console.log("ßßßßßßßßßßßßß Missing money list ßßßßßßßßßßßß", snap.docs);
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
          <Column gridColumn="1 / 3">Faltantes de la semana</Column>
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
              <Column
                title={doc.data().created_at?.toDate().toLocaleDateString()}
              >
                {doc
                  .data()
                  .created_at?.isEqual(
                    invoice.data().created_at as unknown as Timestamp
                  )
                  ? "Esta factura"
                  : Days[doc.data().created_at?.toDate().getDay() ?? 0]}
              </Column>
              <Column>
                <Container>
                  {numberParser(doc.data().diff.amount)}

                  <HideButton onClick={() => checkOneHandler(doc.ref)}>
                    Pagado
                  </HideButton>
                </Container>
              </Column>
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
