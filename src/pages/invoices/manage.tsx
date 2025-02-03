import { Products } from "@/components/pages/invoice/manage/products";
import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import { FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useState } from "react";
import styled from "styled-components";

const MainContainer = styled(FlexContainer)`
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
`;

export default function Page() {
  const [selectedSeller, setSelectedSeller] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >(undefined);
  const [client, setClient] = useState<QueryDocumentSnapshot<client> | null>(
    null
  );

  return (
    <MainContainer>
      <SelectSeller
        currentSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
      />
      {selectedSeller && (
        <SelectClient
          sellerData={selectedSeller?.data()}
          sellerDoc={selectedSeller}
          setClient={setClient}
          client={client}
        />
      )}

      <Products />
    </MainContainer>
  );
}
