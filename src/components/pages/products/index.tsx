// import { Select } from "@/components/Inputs/select";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProducts } from "@/hooks/products/getProducts";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";
import { Tag, TagsDoc, TagSimple } from "@/tools/products/tags";
import {
  doc,
  DocumentData,
  DocumentReference,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";

const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: 350px;
  grid-auto-rows: auto;
  gap: 10px;
  align-items: start;
  margin-bottom: 50px;

  @media print {
    gap: 0px;
  }
`;

const Product = styled.button<{
  $removeBottomPadding: boolean;
  $selected: boolean;
}>`
  text-align: start;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  background-color: transparent;
  width: 100%;
  height: auto;
  border: 1px solid ${globalCSSVars["--foreground"]};
  padding: 10px;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }

  ${({ $removeBottomPadding }) => {
    if ($removeBottomPadding) {
      return css`
        padding-bottom: 0px;
      `;
    }
  }}

  ${({ $selected }) => {
    if ($selected) {
      return css`
        background-color: ${globalCSSVars["--highlight"]};
      `;
    }
  }}

  @media print {
    grid-column: 1 / -1;
    border: none;
  }
`;

const RemoveOnPrint = styled(Container)`
  @media print {
    display: none;
  }
`;

export function Products() {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const [order, setOrder] = useState<keyof productDoc>("position");
  const [orderByName, setOrderByName] = useState(false);
  const products = useGetProducts(order);
  const [tags, setTags] = useState<Tag>();

  function handlerOnClickChangeOrder() {
    if (!orderByName) {
      setOrder("name");
      setOrderByName(true);
    } else {
      setOrder("position");
      setOrderByName(false);
    }
  }

  function handlerOnClik(
    product: QueryDocumentSnapshot<productDoc, DocumentData>
  ) {
    if (setSelectedProduct) setSelectedProduct(product);

    window.scroll({
      top: 0,
      behavior: "smooth",
    });
  }

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

  return (
    <Container styles={{ marginBottom: "100px" }}>
      <RemoveOnPrint>
        <FlexContainer
          styles={{
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ marginRight: "10px" }}>
            {products.snap && products.snap?.size > 0
              ? "Productos"
              : "No hay productos"}
          </h2>
          {products.snap && products.snap?.size > 0 && (
            <Button onClick={handlerOnClickChangeOrder}>
              Ordenado por {orderByName ? "Nombre" : "Posición"}
            </Button>
          )}
        </FlexContainer>
        <ProductsContainer>
          {products.docs?.map((_, i) => {
            const data = _.data();
            const bottomPadding = data.tags.filter((el) => tags && tags[el]);
            const stock = data.stock.reduce((before, now) => {
              return before + now.amount;
            }, 0);

            return (
              <Product
                key={i}
                onClick={() => handlerOnClik(_)}
                $selected={selectedProduct?.ref.id === _.ref.id}
                $removeBottomPadding={bottomPadding.length > 0}
              >
                <span>{data.name}</span>{" "}
                {!data.product_parent && (
                  <span
                    style={{
                      textAlign: "end",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    }}
                  >
                    {numberParser(stock)} {data.units}
                  </span>
                )}
              </Product>
            );
          })}
        </ProductsContainer>
        {products.docsDisabled && products.docsDisabled?.length > 0 && (
          <>
            <h3>Productos desabilitados</h3>
            <ProductsContainer>
              {" "}
              {products.docsDisabled.map((_, i) => {
                const data = _.data();
                const bottomPadding = data.tags.filter(
                  (el) => tags && tags[el]
                );
                const stock = (data.stock || []).reduce((before, now) => {
                  return before + now.amount;
                }, 0);

                return (
                  <Container key={i}>
                    <Product
                      onClick={() => handlerOnClik(_)}
                      $removeBottomPadding={bottomPadding.length > 0}
                      $selected={selectedProduct?.ref.id === _.ref.id}
                    >
                      <h4 style={{ marginBottom: "10px" }}>
                        {data.name} - {numberParser(stock)} {data.units}
                      </h4>
                      <Container>
                        {tags &&
                          data.tags.map((el, i) => {
                            const data = tags[el];

                            if (data)
                              return (
                                <TagSimple $bg={data.color} key={i}>
                                  {data.name}
                                </TagSimple>
                              );
                          })}
                      </Container>
                    </Product>
                  </Container>
                );
              })}
            </ProductsContainer>
          </>
        )}
      </RemoveOnPrint>
    </Container>
  );
}
