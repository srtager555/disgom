import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import {
  collection,
  CollectionReference,
  DocumentSnapshot,
  getDoc,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

const DeleteButton = styled(Button)`
  padding: 5px 10px;
`;

interface props {
  sellerDoc: DocumentSnapshot<SellersDoc> | undefined;
  clientDoc: DocumentSnapshot<client> | undefined;
}

export function SellerDefaultPrices({ sellerDoc, clientDoc }: props) {
  const [prices, setPrices] = useState<
    QueryDocumentSnapshot<defaultCustomPrice>[]
  >([]);
  const [pricesSorted, setPricesSorted] = useState<
    Array<{
      product: DocumentSnapshot<productDoc>;
      defaultPrice: QueryDocumentSnapshot<defaultCustomPrice>;
    }>
  >([]);

  // effect to get the default prices
  useEffect(() => {
    if (!sellerDoc) return;

    let coll;
    if (clientDoc) {
      coll = collection(
        clientDoc.ref,
        SellersCollection.defaulCustomPrices
      ) as CollectionReference<defaultCustomPrice>;
    } else {
      coll = collection(
        sellerDoc.ref,
        SellersCollection.defaulCustomPrices
      ) as CollectionReference<defaultCustomPrice>;
    }

    const q = query(coll, where("disabled", "==", false));

    const unsubcribe = onSnapshot(q, (snap) => {
      setPrices(snap.docs);
    });

    return () => {
      unsubcribe();
      setPrices([]);
    };
  }, [sellerDoc, clientDoc]);

  // effect to sort the prices by product position
  useEffect(() => {
    async function sortPrices() {
      const products = await Promise.all(
        prices.map(async (el) => {
          const productRef = el.data().product_ref;
          const product = await getDoc(productRef);
          return {
            product,
            defaultPrice: el,
          };
        })
      );

      const sorted = products.sort((a, b) => {
        return (
          (a.product.data()?.position || 0) - (b.product.data()?.position || 0)
        );
      });

      setPricesSorted(sorted);
    }

    sortPrices();
  }, [prices]);

  return (
    <Container styles={{ flex: "1" }}>
      <h2 style={{ marginBottom: "0px" }}>Precios personalizados</h2>
      <p>Precio actual {"=>"} Precio personalizado</p>
      <FlexContainer
        styles={{ marginTop: "20px", flexWrap: "wrap", gap: "10px" }}
      >
        {pricesSorted.length > 0 ? (
          pricesSorted.map((el, i) => {
            return (
              <DefaultPrice
                key={i}
                defaultPriceDoc={el.defaultPrice}
                productDoc={el.product}
              />
            );
          })
        ) : (
          <p>No hay precios por defecto</p>
        )}
      </FlexContainer>
    </Container>
  );
}

interface DefaultPriceProps {
  defaultPriceDoc: QueryDocumentSnapshot<defaultCustomPrice>;
  productDoc: DocumentSnapshot<productDoc>;
}

function DefaultPrice({ defaultPriceDoc, productDoc }: DefaultPriceProps) {
  const productData = productDoc?.data();

  const removeDefaultPrice = useCallback(async () => {
    await updateDoc(defaultPriceDoc.ref, {
      disabled: true,
    });
    console.log("Default price marked as disabled.");
  }, [defaultPriceDoc.ref]);

  const debounceRemove = useCallback(debounce(removeDefaultPrice, 5000), [
    removeDefaultPrice,
  ]);

  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        border: "1px solid " + globalCSSVars["--detail"],
        padding: "10px",
        minWidth: "32%",
      }}
    >
      <FlexContainer
        styles={{
          alignItems: "center",
          flex: "1",
        }}
      >
        <b>{productData?.name}</b>
      </FlexContainer>
      <FlexContainer
        styles={{
          alignItems: "center",
        }}
      >
        <span style={{ marginRight: "10px" }}>
          {numberParser(productData?.stock[0]?.sale_price ?? 0)} {"=>"}{" "}
          {numberParser(defaultPriceDoc.data().price)}
        </span>

        <DeleteButton
          $warn
          $hold
          onMouseDown={debounceRemove}
          onMouseLeave={debounceRemove.cancel}
          onMouseUp={debounceRemove.cancel}
        >
          X
        </DeleteButton>
      </FlexContainer>
    </FlexContainer>
  );
}
