import SalesComparisonChart, { ChartData } from "@/components/chart";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { FormToAddStock } from "@/components/pages/invoice/Products/FormToAddStock";
import { ProductStock } from "@/components/pages/invoice/Products/Stock";
import { useGetProduct } from "@/hooks/products/getProduct";
import { NextPageWithLayout } from "@/pages/_app";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { outputType } from "@/tools/products/addOutputs";
import { stockType } from "@/tools/products/addToStock";
import { getCurrentTwoWeekRange } from "@/tools/time/current";
import {
  collection,
  CollectionReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ReactElement, useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";

const FadeContainer = styled(Container)<{ $fade: boolean }>`
  &:after {
    content: "";
    ${(props) =>
      !props.$fade &&
      css`
        display: none;
      `}
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: not-allowed;
  }
  ${(props) =>
    props.$fade &&
    css`
      opacity: 0.3;
    `}
`;

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 22px;
  gap: 10px;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / 6;
  grid-row: 1 / 8;
`;

// const Chart = styled.div`
//   flex: 1;
//   background-color: #ccc;
//   border-radius: 20px;
// `;

const StockContainer = styled.div`
  grid-column: 6 / 9;
  grid-row-start: 1;
`;

const FormContainer = styled.div`
  display: grid;
  grid-column: 1 / 6;
  grid-row: 9 / 15;
`;

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();

  const [entryToEdit, setEntryToEdit] = useState<stockType | undefined>();
  const [stock, setStock] = useState<stockType[]>([]);
  const [invoiceDataToChart, setInvoiceDataToChart] = useState<ChartData>([]);

  // effect to sort the product stock by date
  useEffect(() => {
    const s = product.data?.stock;
    if (!s || s?.length === 0) {
      setStock([]);
      return;
    }

    const stock = s.sort((a, b) => {
      return b.created_at.seconds - a.created_at.seconds;
    });

    setStock(stock);
  }, [product.data?.stock]);

  useEffect(() => {
    setEntryToEdit(undefined);
  }, [selectedProduct]);

  // effect to get the product amount sold
  useEffect(() => {
    if (!selectedProduct) return;

    async function getSales() {
      console.log("?");
      const db = Firestore();
      const coll = collection(db, InvoiceCollection.root);
      const range = getCurrentTwoWeekRange();

      const q = query(
        coll,
        where("disabled", "==", false),
        where("created_at", "<=", range.end),
        where("created_at", ">=", range.start)
      ) as CollectionReference<invoiceType>;
      const invoices = await getDocs(q);

      console.log("??", invoices.docs);

      if (invoices.docs.length === 0) {
        setInvoiceDataToChart([]);
        return;
      }

      invoices.docs.forEach(async (doc) => {
        const coll = collection(doc.ref, "outputs_sold");
        const q = query(
          coll,
          where("disabled", "==", false),
          where("product_ref", "==", selectedProduct?.ref)
        ) as CollectionReference<outputType>;
        const outputs_sold = await getDocs(q);

        const outputs = outputs_sold.docs.map((output) => {
          return {
            createdAt: output.data().created_at?.toDate() as Date,
            amount: output.data().amount,
          };
        }, 0);

        setInvoiceDataToChart(outputs);
        // setInvoiceDataToChart((prevdata]);
      });
    }

    getSales();

    return () => {
      setInvoiceDataToChart([]);
    };
  }, [selectedProduct]);

  return (
    <Container>
      <p style={{ fontStyle: "italic" }}>
        Para ver la información de un producto, selecciónelo en la lista de
        productos
      </p>
      <FadeContainer $fade={selectedProduct ? false : true}>
        <h1>{selectedProduct?.data().name}</h1>
        <MainContainer>
          <ChartContainer>
            <h3>Ventas semanales</h3>
            <SalesComparisonChart
              invoiceDataToChart={invoiceDataToChart}
              numberOfDaysToShow={10} // Ejemplo: Mostrar los últimos 10 días y su comparativa
            />
          </ChartContainer>
          <StockContainer>
            <ProductStock
              stock={stock}
              entryToEdit={entryToEdit}
              setEntryToEdit={setEntryToEdit}
            />
          </StockContainer>
          <FormContainer>
            <FormToAddStock
              stock={stock}
              entryToEdit={entryToEdit}
              setEntryToEdit={setEntryToEdit}
            />
          </FormContainer>
        </MainContainer>
      </FadeContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
