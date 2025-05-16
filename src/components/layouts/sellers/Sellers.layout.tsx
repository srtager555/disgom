import { Container } from "@/styles/index.styles";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { SellersDoc } from "@/tools/sellers/create";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import useQueryParams from "@/hooks/getQueryParams";
import { getSeller } from "@/tools/sellers/getSeller";

type props = {
  children: children;
};

type sellerSelected = QueryDocumentSnapshot<SellersDoc> | undefined;
type setSellerSelected = Dispatch<SetStateAction<sellerSelected>> | undefined;

export const SellerContext = createContext<{
  sellerSelected: sellerSelected;
  setSellerSelected: setSellerSelected;
}>({
  sellerSelected: undefined,
  setSellerSelected: undefined,
});

export function SellersLayout({ children }: props) {
  const [sellerSelected, setSellerSelected] =
    useState<sellerSelected>(undefined);
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const params = useQueryParams();

  useEffect(() => {
    async function getTheSeller() {
      if (!params.id) return setSeller(undefined);

      const s = await getSeller(params.id);
      setSeller(s);
    }

    getTheSeller();
  }, [params]);

  return (
    <SellerContext.Provider value={{ sellerSelected, setSellerSelected }}>
      <Container styles={{ marginTop: "20px" }}>
        <h1 style={{ textAlign: "center" }}>{seller?.data()?.name}</h1>
        {children}
      </Container>
    </SellerContext.Provider>
  );
}
