import { Container } from "@/styles/index.styles";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { SellersDoc } from "@/tools/sellers/create";
import {
  doc,
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";

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
  const { id, clientID } = useQueryParams();
  const sellers = useGetSellers();

  useEffect(() => {
    if (!id) return setSeller(undefined);

    const s = sellers?.docs.find((s) => s.id === id);
    setSeller(s);
  }, [id, sellers]);

  useEffect(() => {
    async function getClient() {
      if (!clientID) return setSeller(undefined);

      const office = sellers?.docs.find((s) => !s.data().hasInventory);
      if (!office) return setSeller(undefined);

      const r = doc(office.ref, SellersCollection.clients, clientID);

      const s = await getDoc(r);
      setSeller(s as DocumentSnapshot<SellersDoc>);
    }

    getClient();
  }, [clientID, sellers]);

  return (
    <SellerContext.Provider value={{ sellerSelected, setSellerSelected }}>
      <Container styles={{ marginTop: "20px" }}>
        <h1 style={{ textAlign: "center" }}>{seller?.data()?.name}</h1>
        {children}
      </Container>
    </SellerContext.Provider>
  );
}
