import { Container, FlexContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { SellersDoc } from "@/tools/sellers/create";
import { clientCredit, credit } from "@/tools/sellers/credits/create";
import { getCredits } from "@/tools/sellers/credits/get";
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  QuerySnapshot,
} from "firebase/firestore";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { globalCSSVars } from "@/styles/colors";
import { creditToUpdate } from "../../../Credit";
import { invoiceType } from "@/tools/invoices/createInvoice";

type allDiffs = Record<string, number | creditToUpdate>;

type props = {
  seller_ref: DocumentReference<SellersDoc>;
  invoiceData: invoiceType;
  setCreditTotal: Dispatch<SetStateAction<number>>;
};

export function Credit({ seller_ref, invoiceData, setCreditTotal }: props) {
  const [credits, setCredits] = useState<QuerySnapshot<clientCredit>>();
  const route = useMemo(() => invoiceData.route, [invoiceData]);
  const [allDiffs, setAllDiffs] = useState<allDiffs>({});
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(true);

  // effect to get the credits
  useEffect(() => {
    async function credits() {
      if (!refresh) return;
      if (!route) return;

      const credits = await getCredits(route, seller_ref);

      setCredits(credits);
      setRefresh(false);
    }

    credits();
  }, [refresh, route, seller_ref]);

  // effect to manage the credit diff
  useEffect(() => {
    const values = Object.values(allDiffs);

    const total: number = values.reduce((before: number, now): number => {
      if (typeof now === "number") {
        return before + now;
      } else return before + now.amount;
    }, 0);

    setTotal(total);
    setCreditTotal(total);
  }, [allDiffs, setCreditTotal]);

  return (
    <Container styles={{ width: "525px" }}>
      <h2>Cambios en los Creditos</h2>
      <Container>
        <FlexContainer
          styles={{ width: "525px", justifyContent: "space-between" }}
        >
          <h3>Creditos</h3>
          <p>Anterior/nuevo/diferencia</p>
        </FlexContainer>
        {!credits || credits.size === 0 ? (
          <p>No hay creditos actualmente</p>
        ) : (
          <Container styles={{ marginBottom: "10px" }}>
            <h4>Creditos anteriores</h4>
            {invoiceData.newCredits?.map((el, i) => (
              <ClientCredit creditRef={el} setAllDiffs={setAllDiffs} key={i} />
            ))}
          </Container>
        )}
        <FlexContainer styles={{ justifyContent: "flex-end" }}>
          <FlexContainer>
            <Container
              styles={{
                width: "75px",
                marginRight: "10px",
                textAlign: "center",
              }}
            >
              <h4>Total</h4>
            </Container>
            <Container styles={{ width: "75px", textAlign: "center" }}>
              {numberParser(total)}
            </Container>
          </FlexContainer>
        </FlexContainer>
      </Container>
    </Container>
  );
}

type awdfawf = {
  creditRef: DocumentReference<credit>;
  setAllDiffs: Dispatch<SetStateAction<allDiffs>>;
};

function ClientCredit({ creditRef, setAllDiffs }: awdfawf) {
  const [client, setClient] = useState<DocumentSnapshot<clientCredit>>();
  const [credit, setCredit] = useState<DocumentSnapshot<credit>>();
  const data = useMemo(() => credit?.data(), [credit]);
  const clientData = useMemo(() => client?.data(), [client]);
  const [diff, setDiff] = useState<number | string>("...");

  // effecto manage the difference
  useEffect(() => {
    if (!data) return;

    const before = data.last_amount || 0;
    const now = data.amount;

    setDiff(before - now);

    setAllDiffs((props) => {
      return {
        ...props,
        [creditRef.id]: {
          newAmount: now,
          amount: before - now,
          ref: creditRef.parent.parent as DocumentReference<clientCredit>,
        },
      };
    });
  }, [creditRef.id, creditRef, data, setAllDiffs]);

  // effecto get the credit
  useEffect(() => {
    async function getCredit() {
      const credit = await getDoc(creditRef);
      const client = await getDoc(
        creditRef.parent.parent as DocumentReference<clientCredit>
      );

      setClient(client);
      setCredit(credit);
    }

    getCredit();
  }, [creditRef]);

  if (!data || !clientData) return <>Cargando...</>;

  return (
    <FlexContainer
      styles={{
        borderBottom: "1px solid " + globalCSSVars["--detail"],
        alignItems: "center",
      }}
    >
      <Container styles={{ width: "300px", marginRight: "10px" }}>
        <p style={{ marginBottom: "0px" }}>{clientData.name}</p>
        <small>{clientData.address}</small>
      </Container>
      <FlexContainer styles={{ height: "100%" }}>
        <Container
          styles={{ width: "75px", marginRight: "10px", textAlign: "center" }}
        >
          {data.last_amount ? numberParser(data.last_amount) : "Nuevo"}
        </Container>
        <Container
          styles={{ width: "75px", marginRight: "10px", height: "100%" }}
        >
          {numberParser(data.amount)}
        </Container>
        <Container
          styles={{ width: "75px", height: "100%", textAlign: "center" }}
        >
          {typeof diff === "number" ? numberParser(diff) : diff}
        </Container>
      </FlexContainer>
    </FlexContainer>
  );
}
