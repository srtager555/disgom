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

  return (
    <Container styles={{ flex: "1" }}>
      <h2 style={{ marginBottom: "0px" }}>Precios personalizados</h2>
      <p>Precio actual {"=>"} Precio personalizado</p>
      <FlexContainer
        styles={{ marginTop: "20px", flexWrap: "wrap", gap: "1%" }}
      >
        {prices.length > 0 ? (
          prices.map((el, i) => {
            return <DefaultPrice key={i} defaultPriceDoc={el} />;
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
}

function DefaultPrice({ defaultPriceDoc }: DefaultPriceProps) {
  const [productDoc, setProductDoc] = useState<DocumentSnapshot<productDoc>>();
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

  // effect to get the product
  useEffect(() => {
    async function getProduct() {
      const productRef = defaultPriceDoc.data().product_ref;
      const fetch = await getDoc(productRef);
      setProductDoc(fetch);
    }

    getProduct();
  }, [defaultPriceDoc]);

  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        border: "1px solid " + globalCSSVars["--detail"],
        padding: "10px",
        marginBottom: "10px",
        width: "49%",
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
