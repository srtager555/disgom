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

const Page: NextPageWithLayout = () => {
  const { id } = useQueryParams();
  const [sellerDoc, setSellerDoc] = useState<DocumentSnapshot<SellersDoc>>();

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

  if (!id) return <></>;

  return (
    <Container>
      <SellerChart sellerDoc={sellerDoc} />
      <FlexContainer styles={{ gap: "20px" }}>
        <SellerCreditPreviewMapper sellerDoc={sellerDoc} />
        <SellerDefaultPrices sellerDoc={sellerDoc} />
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
