import { HideWithoutStock } from "@/components/pages/products/HideWithoutStock";
import { SelectTag } from "@/components/pages/products/SelectTag";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Dispatch, SetStateAction, useState } from "react";
import { Descriptions, productResult } from "../../ProductList";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { Product as P } from "../../Product";
import { MemoProduct } from "./Product";
import { Button } from "@/styles/Form.styles";
import { useGetAllInventory } from "@/hooks/invoice/getAllInventory";
import { useInvoice } from "@/contexts/InvoiceContext";

type props = {
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
};

export function Products({ selectedSeller, setProductsResults }: props) {
  const { invoice } = useInvoice();
  const [tagSelected, setTagSelected] = useState("");
  const productsList = useGetProducts(tagSelected);
  const [hideProductWithoutStock, setHideProductWithoutStock] = useState(false);
  const allInventory = useGetAllInventory(
    invoice?.data()?.last_inventory_ref || undefined
  );

  return (
    <Container styles={{ marginTop: "20px" }}>
      <FlexContainer styles={{ marginBottom: "20px" }}>
        <SelectTag setTagSelected={setTagSelected} />
        <Container styles={{ marginRight: "20px" }}>
          <HideWithoutStock
            setHideProductWithoutStock={setHideProductWithoutStock}
            hideProductWithoutStock={hideProductWithoutStock}
          />
        </Container>
        <Button
          onClick={() => {
            window.print();
          }}
        >
          Imprimir
        </Button>
      </FlexContainer>
      <Container>
        <Descriptions hasInventory={selectedSeller?.data().hasInventory} />
        {productsList?.docs?.map((product, i) => {
          return (
            <MemoProduct
              key={i}
              doc={product}
              selectedSeller={selectedSeller}
              hideProductWithoutStock={hideProductWithoutStock}
              allInventory={allInventory}
              setProductsResults={setProductsResults}
            />
          );
        })}
      </Container>
    </Container>
  );
}
