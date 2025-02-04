import { useGetProducts } from "@/hooks/products/getProducts";
import { Column, Product } from "./Product";
import { Container, FlexContainer } from "@/styles/index.styles";
import styled, { css } from "styled-components";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { InvoiceContext } from "@/pages/invoices/create";
import { globalCSSVars } from "@/styles/colors";
import { Select } from "@/components/Inputs/select";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { Tag, TagsDoc } from "@/tools/products/tags";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { Button } from "@/styles/Form.styles";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { outputType } from "@/tools/products/addOutputs";
import { Icon } from "@/components/Icons";

export type priceVariation = {
  total: number;
  variations: Array<{
    amount: number;
    price: number;
  }>;
};

export type productResult = {
  amount: number;
  cost: number;
  sold: priceVariation;
  profit: number;
  seller_sold: priceVariation;
  seller_profit: number;
};

export const ProductContainer = styled.div<{
  $hasInventory: boolean | undefined;
  $withoutStock?: number;
  $header?: boolean;
  $fold?: boolean;
  $children?: boolean;
  $closing?: boolean;
  $warn?: boolean;
  $hide?: boolean;
  $after?: string;
}>`
  position: relative;
  display: ${(props) => (props.$fold ? "none" : "grid")};
  grid-column: 1 / -1;
  gap: 10px;
  transition: 200ms ease all;
  height: ${(props) =>
    !props.$hide ? (props.$fold ? "35px" : "auto") : "0px"};
  /* padding: ${(props) =>
    !props.$hide ? (props.$header ? "10px" : "5px") : 0} 0; */
  visibility: ${(props) => (props.$hide ? "hidden" : "visible")};
  grid-template-columns: ${(props) => {
    if (props.$closing) return "repeat(17, 75px)";
    if (props.$hasInventory) {
      return "repeat(13, 75px)";
    } else {
      return "repeat(10, 75px)";
    }
  }};

  &:nth-child(even) {
    ${(props) => {
      if (props.$children) {
        return css`
          background-color: transparent;
        `;
      }

      return css`
        background-color: ${globalCSSVars["--background-highlight"]};
      `;
    }}
  }

  @media print {
    grid-template-columns: repeat(20, 1fr);
  }

  ${(props) =>
    props.$header &&
    css`
      position: sticky;
      top: 0;
      z-index: 999;
      /* box-shadow: 0 5px 15px #0003; */
    `}

  ${(props) =>
    props.$after &&
    css`
      &::after {
        content: "${props.$after}";
        position: absolute;
        right: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        text-align: end;
        white-space: nowrap;
      }
    `}

  ${(props) =>
    props.$warn &&
    css`
      color: red;
      font-weight: bold;
      text-decoration: underline;
    `}

  ${(props) =>
    !props.$children
      ? css`
          /* padding-left: 10px; */
          background-color: ${globalCSSVars["--background"]};
        `
      : css`
          background-color: transparent;
        `}

  ${(props) =>
    !props.$withoutStock &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

type props = {
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
  invoiceToEditData: invoiceType | undefined;
};

export function ProductList({ setProductsResults, invoiceToEditData }: props) {
  const [tagSelected, setTagSelected] = useState("");
  const products = useGetProducts(tagSelected);
  const [tags, setTags] = useState<Tag>();
  const { selectedSeller } = useContext(InvoiceContext);
  const [hideProductWithoutStock, setHideProductWithoutStock] = useState(false);
  const [allPreviusOutputsToEdit, setAllPreviusOutputsToEdit] = useState<
    DocumentSnapshot<outputType>[]
  >([]);

  useEffect(() => {
    const db = Firestore();
    const ref = doc(
      db,
      ProductsCollection.root,
      ProductsCollection.tags
    ) as DocumentReference<TagsDoc>;

    const unsubcribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) setTags(data.tags);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  // effect to get each output to send to the respective product
  // when the edit mode is on
  useEffect(() => {
    async function getOuputs() {
      const outputs = invoiceToEditData?.products_outputs;

      if (!outputs) return;

      const apo = outputs.map(async (el) => {
        const output = await getDoc(el);

        return output;
      });

      const apoResolved = await Promise.all(apo);
      setAllPreviusOutputsToEdit(apoResolved);
    }

    getOuputs();
  }, [invoiceToEditData?.products_outputs]);

  return (
    <Container styles={{ margin: "50px 0" }}>
      <FlexContainer styles={{ marginBottom: "20px" }}>
        <Container styles={{ marginRight: "20px" }}>
          Filtrar por etiquetas{" "}
          {tags && (
            <Select
              onChange={(e) => {
                setTagSelected(e.target.value);
              }}
              options={[
                { name: "Sin filtro", value: "", selected: true },
                ...Object.values(tags).map((el) => ({
                  name: el.name,
                  value: el.name,
                })),
              ]}
            />
          )}
        </Container>
        <Container styles={{ marginRight: "20px" }}>
          <Button
            onClick={() => setHideProductWithoutStock(!hideProductWithoutStock)}
          >
            {hideProductWithoutStock ? "Mostrar todo" : "Solo con existencias"}
          </Button>
        </Container>
      </FlexContainer>
      <Container>
        <Descriptions hasInventory={selectedSeller?.data().hasInventory} />

        {products.docs?.length === 0 ? (
          <>No hay productos</>
        ) : (
          products.docs?.map((el, i) => {
            const previusOutputsToEdit = allPreviusOutputsToEdit.filter(
              (_) => _.ref.parent.parent?.id === el.id
            );

            return (
              <Product
                key={i}
                product={el}
                setProductsResults={setProductsResults}
                hasInventory={selectedSeller?.data().hasInventory}
                hideWithoutStock={hideProductWithoutStock}
                previusOutputsToEdit={previusOutputsToEdit}
              />
            );
          })
        )}
      </Container>
    </Container>
  );
}

export const Descriptions = ({
  hasInventory,
}: {
  hasInventory: boolean | undefined;
}) => (
  <ProductContainer $header $withoutStock={1} $hasInventory={hasInventory}>
    <Column gridColumn="1 / 4" printGridColumn="1 / 8">
      Producto
    </Column>
    <Column gridColumn="4 / 5" printGridColumn="8 / 10">
      Guardo
    </Column>
    <Column gridColumn="5 / 6">Consig.</Column>
    <Column gridColumn="6 / 7">Devol</Column>
    <Column gridColumn="7 / 8" printGridColumn="-4 / -6">
      Venta
    </Column>
    <Column gridColumn="8 / 9" printGridColumn="-1 / -4">
      Precio
    </Column>
    <Column gridColumn="9 / 10">Total</Column>
    <Column gridColumn="10 / 11">Com.</Column>
    <Column gridColumn="11 / 12">
      <Container styles={{ marginRight: "10px" }}>
        <Icon iconType="fold" />
      </Container>
    </Column>
  </ProductContainer>
);
