import { useGetProducts } from "@/hooks/products/getProducts";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { Tag, TagComponent, TagsDoc } from "@/tools/products/tags";
import { doc, DocumentReference, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 10px;
`;

const Product = styled.div<{ $removeBottomPadding: boolean }>`
  width: 100%;
  height: auto;
  border-radius: 20px;
  border: 2px solid ${globalCSSVars["--foreground"]};
  padding: 10px;
  ${(props) =>
    props.$removeBottomPadding &&
    css`
      padding-bottom: 0px;
    `}
`;

export function Products() {
  const products = useGetProducts();
  const [tags, setTags] = useState<Tag>();

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
            console.log(tags);
            console.log(data.tags);
            const bottomPadding = data.tags.filter((el) => tags[el]);
            console.log("filter", bottomPadding);

            return (
              <Container key={i}>
                <Product $removeBottomPadding={bottomPadding.length > 0}>
                  <h3>
                    {data.name} - {data.units}
                  </h3>
                  <Container>
                    {data.tags.map((el, i) => {
                      const data = tags[el];

                      if (data)
                        return (
                          <TagComponent $bg={data.color} key={i}>
                            {data.name}
                          </TagComponent>
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
