import { SellersLayout } from "@/components/layouts/sellers/Sellers.layout";
import { SellersList } from "@/components/layouts/sellers/SellersList.layout";
import useQueryParams from "@/hooks/getQueryParams";
import { NextPageWithLayout } from "@/pages/_app";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { ReactElement, useEffect, useState } from "react";
import { SellerChart } from "@/components/pages/sellers/SellerChart";
import { SellerCreditPreviewMapper } from "@/components/pages/sellers/SellerCreditPreview";
import { SellerDefaultPrices } from "@/components/pages/sellers/DefaultPrices";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { client } from "@/tools/sellers/createClient";

const Page: NextPageWithLayout = () => {
  const { id, clientID } = useQueryParams();
  const [sellerDoc, setSellerDoc] = useState<DocumentSnapshot<SellersDoc>>();
  const [clientDoc, setClientDoc] = useState<DocumentSnapshot<client>>();
  const sellers = useGetSellers();

  // effect to get the seller
  useEffect(() => {
    async function getSeller() {
      if (!id) return;

      const db = Firestore();
      const docRef = doc(
        db,
        SellersCollection.root,
        id
      ) as DocumentReference<SellersDoc>;

      const sellerDoc = await getDoc(docRef);
      setSellerDoc(sellerDoc);
    }

    getSeller();
  }, [id]);

  useEffect(() => {
    async function getClient() {
      if (!clientID) return setClientDoc(undefined);

      const office = sellers?.docs.find((s) => !s.data().hasInventory);
      if (!office) return setClientDoc(undefined);

      const r = doc(office.ref, SellersCollection.clients, clientID);

      const s = await getDoc(r);
      setClientDoc(s as DocumentSnapshot<client>);
    }

    getClient();
  }, [clientID, sellers]);

  if (!id) return <></>;

  return (
    <Container>
      <SellerChart sellerDoc={sellerDoc} clientDoc={clientDoc} />
      <FlexContainer styles={{ gap: "20px" }}>
        {sellerDoc?.data()?.hasInventory && (
          <SellerCreditPreviewMapper sellerDoc={sellerDoc} />
        )}
        <SellerDefaultPrices sellerDoc={sellerDoc} clientDoc={clientDoc} />
      </FlexContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <SellersLayout>
      {page}
      <SellersList />
    </SellersLayout>
  );
};

export default Page;
