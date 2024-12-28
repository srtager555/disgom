import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProducts } from "@/hooks/products/getProducts";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
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
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 10px;
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
`;

export function Products() {
  const { setSelectedProduct } = useContext(ProductContext);
  const products = useGetProducts();
  const [tags, setTags] = useState<Tag>();

  function handlerOnClik(
    product: QueryDocumentSnapshot<productDoc, DocumentData>
  ) {
    if (setSelectedProduct) setSelectedProduct(product);
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
    <>
      <h2>Productos</h2>
      <ProductsContainer>
        {tags &&
          products.docs?.map((_, i) => {
            const data = _.data();
            const bottomPadding = data.tags.filter((el) => tags[el]);

            return (
              <Container key={i}>
                <Product
                  onClick={() => handlerOnClik(_)}
                  $removeBottomPadding={bottomPadding.length > 0}
                >
                  <h3>
                    {data.name} - {data.units}
                  </h3>
                  <Container>
                    {data.tags.map((el, i) => {
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
  );
}
