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
import { InvoiceContext } from "@/trash/create";
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
  sold: number;
  profit: number;
  seller_sold: number;
  seller_profit: number;
};

export const ProductContainer = styled.div<{
  $hasInventory: boolean | undefined;
  $withoutStock?: number;
  $header?: boolean;
  $fold?: boolean;
  $children?: boolean;
  $closing?: boolean;
  $hide?: boolean;
  $after?: string;
  $highlight?: boolean;
}>`
  position: relative;
  display: grid;
  grid-column: 1 / -1;

  transition: 200ms ease all;
  height: ${(props) =>
    // !props.$hide ? (!props.$fold ? "36px" : "auto") : "0px"};
    !props.$hide ? "auto" : "0px"};
  visibility: ${(props) => (props.$hide ? "hidden" : "visible")};
  grid-template-columns: 75px repeat(12, 85px);

  @media print {
    grid-template-columns: repeat(auto-fit, minmax(1fr, 1fr));

    & > * {
      font-size: 0.8rem !important;
    }

    /* grid-template-columns: repeat(10, 85px); */
  }

  border-left: 1px solid ${globalCSSVars["--detail"]};
  border-right: 1px solid ${globalCSSVars["--detail"]};
  border-bottom: 1px solid ${globalCSSVars["--detail"]};

  &:nth-child(even) {
    ${(props) => {
      if (props.$children) {
        return css`
          background-color: inherit;
        `;
      }

      if (props.$highlight) {
        return css`
          background-color: #024d7c;
        `;
      } else {
        return css`
          background-color: ${globalCSSVars["--background-highlight"]};
        `;
      }
    }}
  }

  &:first-child {
    border-top: 1px solid ${globalCSSVars["--detail"]};
  }

  ${(props) =>
    props.$header &&
    css`
      position: sticky;
      top: 0;
      z-index: 1;
      color: #fff;
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
    !props.$children
      ? css`
          /* padding-left: 10px; */
          background-color: ${props.$highlight
            ? globalCSSVars["--selected"]
            : globalCSSVars["--background"]};
        `
      : css`
          background-color: transparent;
        `}

  ${(props) =>
    !props.$withoutStock &&
    css`
      @media print {
        opacity: 1;
      }

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
  <ProductContainer
    $header
    $withoutStock={1}
    $highlight
    $hasInventory={hasInventory}
  >
    <Column className="hide-print">Inventario</Column>
    <Column
      gridColumn={hasInventory ? "2 / 5" : "2 / 5"}
      printGridColumn={hasInventory ? "1 / 5" : "1 / 7"}
    >
      {hasInventory ? "Producto" : "DESCRIPCION"}
    </Column>
    <Column hide={!hasInventory}>Guardo</Column>
    <Column $textAlign="center">{hasInventory ? "Consig." : "CANT."}</Column>
    <Column hide={!hasInventory}>Devol.</Column>
    <Column hide={!hasInventory}>Venta</Column>
    <Column
      gridColumn={hasInventory ? "" : "span 2"}
      printGridColumn={hasInventory ? "" : "span 3"}
      $textAlign="center"
    >
      {hasInventory ? "Precio" : "PRECIO UNITARIO"}
    </Column>
    <Column
      gridColumn={hasInventory ? "" : "span 3"}
      printGridColumn={hasInventory ? "span 2" : "span 3"}
      $textAlign="center"
    >
      {hasInventory ? "Total" : "IMPORTE"}
    </Column>
    <Column className="hide-print" hide={!hasInventory} hideOnPrint>
      Comision
    </Column>
    <Column
      className="hide-print"
      hideOnPrint
      gridColumn={!hasInventory ? "span 2" : ""}
      $textAlign="center"
    >
      Utilidad
    </Column>
    <Column className="hide-print" hideOnPrint>
      <Container styles={{ marginRight: "10px" }}>
        <Icon iconType="fold" />
      </Container>
    </Column>
  </ProductContainer>
);
