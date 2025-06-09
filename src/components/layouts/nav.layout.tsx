// src/components/layouts/nav.layout.tsx
import { NavContainer } from "@/styles/Nav.module";
import { Container } from "@/styles/index.styles";
import { useContext, useEffect, useState } from "react"; // Import useMemo
import { useRouter } from "next/router";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { sortSellersByName } from "@/tools/sellers/sortSellersByName";
import { filterSellerHasInventory } from "@/tools/sellers/filterHasInventory";
import { TheMotherFuckingNav } from "./nav";
import { LoginContext } from "./login.layout";

export function NavLayout({ children }: { children: children }) {
  // Estado inicial actualizado para usar Record en children
  const { currentUser } = useContext(LoginContext);
  const { asPath } = useRouter();
  const [removeMaxWith, setRemoveMaxWith] = useState(false);
  const [sellers, setSellers] = useState<
    Array<QueryDocumentSnapshot<SellersDoc>>
  >([]);
  const [clients, setClients] = useState(Array<QueryDocumentSnapshot<client>>);
  // Hook para obtener datos de facturas en tiempo real

  // Efecto para cargar vendedores
  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      SellersCollection.root
    ) as CollectionReference<SellersDoc>;
    const q = query(
      coll,
      where("disabled", "==", false),
      where("exclude", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedSellers = snap.docs;

      const sellersWithNoInventory = filterSellerHasInventory(
        fetchedSellers,
        false
      );
      const sellersWithInventory = filterSellerHasInventory(
        fetchedSellers,
        true
      );

      const sellersSorted = [
        ...sortSellersByName(sellersWithNoInventory),
        ...sortSellersByName(sellersWithInventory),
      ];
      setSellers(sellersSorted); // Actualiza el estado de sellers (si aún lo necesitas)
    });

    return unsubscribe;
  }, []);

  // effecto para obtener los clientes
  useEffect(() => {
    const office = sellers.find((el) => !el.data().hasInventory);
    console.log("office", office);
    if (!office) return;

    const coll = collection(
      office.ref,
      SellersCollection.clients
    ) as CollectionReference<client>;

    const unsubcribe = onSnapshot(coll, (snap) => {
      const docs = snap.docs;
      console.log("the clients", docs);

      const clientsSorted = [...docs].sort((a, b) => {
        const nameA = a.data().name?.toLowerCase() || "";
        const nameB = b.data().name?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      });

      setClients(clientsSorted);
    });

    return () => unsubcribe();
  }, [sellers]);

  // Efecto para removeMaxWith (sin cambios)
  useEffect(() => {
    const conditions = [
      asPath.includes("/invoices"),
      asPath.includes("/sellers"),
    ];

    if (conditions.some(Boolean)) {
      return setRemoveMaxWith(true);
    } else {
      return setRemoveMaxWith(false);
    }
  }, [asPath]);

  return (
    <NavContainer $deployNav={false} $removeMaxWith={removeMaxWith}>
      {currentUser && (
        <Container
          styles={{
            position: "sticky",
            left: "0",
            zIndex: "10",
            marginBottom: "30px",
          }}
        >
          <TheMotherFuckingNav sellers={sellers} clients={clients} />
        </Container>
      )}
      {children}
    </NavContainer>
  );
}
