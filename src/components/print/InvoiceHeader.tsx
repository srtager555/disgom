import { useInvoice } from "@/contexts/InvoiceContext";
import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";

const Divition = styled.p`
  text-align: center;
  padding: 10px;
  background-color: ${globalCSSVars["--selected"]};
  color: #fff;
`;

export function PrintInvoiceHeader() {
  const { invoice } = useInvoice();
  const invoiceData = invoice?.data();
  const [name, setName] = useState("");

  // effect to get the seller or client
  useEffect(() => {
    async function getName() {
      if (!invoice) return;
      const data = invoice.data();

      const ref = data.client_ref ? data.client_ref : data.seller_ref;
      if (!ref) return;

      const f = getDoc(ref);
      const doc = await f;

      setName(doc.data()?.name ?? "");
    }

    getName();
  }, [invoice]);

  return (
    <Container
      styles={{ marginBottom: "20px", width: "100%", maxWidth: "1100px" }}
      className="show-print"
    >
      <FlexContainer
        styles={{
          justifyContent: "space-between",
          alignItems: "center",
          color: globalCSSVars["--selected"],
        }}
      >
        <Container>
          <h1>DISTRIBUIDORA GOMEZ</h1>
        </Container>
        <Container styles={{ fontSize: "2.3rem" }}>
          <h1>FACTURA</h1>
        </Container>
      </FlexContainer>
      <FlexContainer
        styles={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Container>
          <Container styles={{ marginBottom: "20px" }}>
            {/* basic Info */}
            <p>La Ceiba, Atl, Aldea Perú, sector Satuye</p>
            <p>Teléfono: 98874082 / 97810303</p>
          </Container>
          <Container>
            {/* basic Info */}
            <Divition>FACTURAR A</Divition>
            <p style={{ fontSize: "1.2rem" }}>
              <b>{name}</b>
            </p>
          </Container>
        </Container>
        <Container
          styles={{ width: "20%", fontSize: "1.2rem", textAlign: "center" }}
        >
          <Divition>FECHA</Divition>
          <p>{invoiceData?.created_at?.toDate().toLocaleDateString()}</p>
          <Divition>TERMINOS</Divition>
          <p>
            <b>{invoiceData?.credit?.paid ? "CONTADO" : "CREDITO"}</b>
          </p>
          {invoiceData?.credit?.paid === false && (
            <>
              <Divition>VENCIMIENTO</Divition>
              <p>
                {invoiceData?.credit?.due_date?.toDate().toLocaleDateString()}
              </p>
            </>
          )}
        </Container>
      </FlexContainer>
    </Container>
  );
}
