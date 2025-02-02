import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
import { FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { DocumentSnapshot } from "firebase/firestore";
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
    DocumentSnapshot<SellersDoc> | undefined
  >(undefined);

  return (
    <MainContainer>
      <SelectSeller
        currentSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
      />
    </MainContainer>
  );
}
