import { ManageClients } from "@/components/pages/sellers/ManageClients";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Page() {
  const [office, setOffice] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >();
  const sellers = useGetSellers();

  useEffect(() => {
    const office = sellers?.docs.find((el) => !el.data().hasInventory);
    if (!office) return;

    setOffice(office);
  }, [sellers]);

  if (!office) return <>Cargando...</>;

  return (
    <FlexContainer
      styles={{
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1>Crea o Edita un Cliente</h1>
      <ManageClients sellerData={office.data()} sellerDoc={office} />
    </FlexContainer>
  );
}
