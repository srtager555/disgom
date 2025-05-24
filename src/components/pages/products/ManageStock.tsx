import { ProductContext } from "@/components/layouts/Products.layout";
import { FormToAddStock } from "@/components/pages/invoice/Products/FormToAddStock";
import { ProductStock } from "@/components/pages/invoice/Products/Stock";
import { useGetProduct } from "@/hooks/products/getProduct";
import { Container } from "@/styles/index.styles";
import { stockType } from "@/tools/products/addToStock";
import { useContext, useEffect, useState } from "react";
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

// const Chart = styled.div`
//   flex: 1;
//   background-color: #ccc;
//   border-radius: 20px;
// `;

export function ManageStock() {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();

  const [entryToEdit, setEntryToEdit] = useState<stockType | undefined>();
  const [stock, setStock] = useState<stockType[]>([]);

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
  // useEffect(() => {
  //   if (!selectedProduct) return;

  //   async function getSales() {
  //     console.log("?");
  //     const db = Firestore();
  //     const coll = collection(db, InvoiceCollection.root);
  //     const range = getCurrentTwoWeekRange();

  //     const q = query(
  //       coll,
  //       where("disabled", "==", false),
  //       where("created_at", "<=", range.end),
  //       where("created_at", ">=", range.start)
  //     ) as CollectionReference<invoiceType>;
  //     const invoices = await getDocs(q);

  //     console.log("??", invoices.docs);

  //     if (invoices.docs.length === 0) {
  //       setInvoiceDataToChart([]);
  //       return;
  //     }

  //     invoices.docs.forEach(async (doc) => {
  //       const coll = collection(doc.ref, "outputs_sold");
  //       const q = query(
  //         coll,
  //         where("disabled", "==", false),
  //         where("product_ref", "==", selectedProduct?.ref)
  //       ) as CollectionReference<outputType>;
  //       const outputs_sold = await getDocs(q);

  //       const outputs = outputs_sold.docs.map((output) => {
  //         return {
  //           createdAt: output.data().created_at?.toDate() as Date,
  //           amount: output.data().amount,
  //         };
  //       }, 0);

  //       setInvoiceDataToChart(outputs);
  //       // setInvoiceDataToChart((prevdata]);
  //     });
  //   }

  //   getSales();

  //   return () => {
  //     setInvoiceDataToChart([]);
  //   };
  // }, [selectedProduct]);

  return (
    <Container>
      <FadeContainer $fade={selectedProduct ? false : true}>
        <MainContainer>
          <FormToAddStock
            stock={stock}
            entryToEdit={entryToEdit}
            setEntryToEdit={setEntryToEdit}
          />
          <ProductStock
            stock={stock}
            entryToEdit={entryToEdit}
            setEntryToEdit={setEntryToEdit}
          />
        </MainContainer>
      </FadeContainer>
    </Container>
  );
}
