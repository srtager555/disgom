import { Select } from "@/components/Inputs/select";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProducts } from "@/hooks/products/getProducts";
import { globalCSSVars } from "@/styles/colors";
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: auto;
  gap: 10px;
  align-items: start;
  margin-bottom: 50px;

  @media print {
    gap: 0px;
  }
`;

const Product = styled.button<{ $removeBottomPadding: boolean }>`
  text-align: start;
  display: block;
  font-size: 1rem;
  background-color: transparent;
  width: 100%;
  height: auto;
  border-radius: 20px;
  border: 2px solid ${globalCSSVars["--foreground"]};
  padding: 10px;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }

  ${(props) =>
    props.$removeBottomPadding &&
    css`
      padding-bottom: 0px;
    `}

  @media print {
    grid-column: 1 / -1;
    border: none;
  }
`;

const ProductTitle = styled.h4`
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;

  @media print {
    margin-bottom: 0px;
  }
`;

const RemoveOnPrint = styled(Container)`
  @media print {
    display: none;
  }
`;

const ShowOnPrint = styled(Container)`
  display: none;

  @media print {
    display: block;
  }
`;

export function Products() {
  const { setSelectedProduct } = useContext(ProductContext);
  const [tagSelected, setTagSelected] = useState("");
  const products = useGetProducts(tagSelected);
  const [tags, setTags] = useState<Tag>();
  const [productToPrint, setProductToPrint] = useState<
    QueryDocumentSnapshot<productDoc, DocumentData>[]
  >([]);

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

  useEffect(() => {
    if (!products.docs) return;

    const productWithStock = products.docs.filter((el) => {
      const data = el.data();
      const stock = data.stock;
      const stockAmount = stock.reduce((before, now) => {
        return before + now.amount;
      }, 0);

      return stockAmount > 0;
    });

    setProductToPrint(productWithStock);
  }, [products.docs]);

  return (
    <Container styles={{ marginBottom: "100px" }}>
      <RemoveOnPrint>
        <FlexContainer>
          <h2 style={{ marginRight: "10px" }}>
            {products.snap && products.snap?.size > 0
              ? "Productos"
              : "No hay productos"}
          </h2>
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
                $removeBottomPadding={bottomPadding.length > 0}
              >
                <ProductTitle>
                  <span>{data.name}</span>{" "}
                  <span
                    style={{
                      textAlign: "end",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    }}
                  >
                    {numberParser(stock)} {data.units}
                  </span>
                </ProductTitle>
                <RemoveOnPrint>
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
                </RemoveOnPrint>
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
      <ShowOnPrint>
        <h2 style={{ textAlign: "center" }}>Inventario de productos</h2>

        <ProductsContainer>
          {productToPrint.map((_, i) => {
            const data = _.data();
            const bottomPadding = data.tags.filter((el) => tags && tags[el]);
            const stock = data.stock.reduce((before, now) => {
              return before + now.amount;
            }, 0);

            return (
              <Product
                key={i}
                onClick={() => handlerOnClik(_)}
                $removeBottomPadding={bottomPadding.length > 0}
              >
                <ProductTitle>
                  <span>{data.name}</span>{" "}
                  <span
                    style={{
                      textAlign: "end",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    }}
                  >
                    {numberParser(stock)} {data.units}
                  </span>
                </ProductTitle>
                <RemoveOnPrint>
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
                </RemoveOnPrint>
              </Product>
            );
          })}
        </ProductsContainer>
      </ShowOnPrint>
    </Container>
  );
}
