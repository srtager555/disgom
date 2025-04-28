// src/components/layouts/nav.layout.tsx
import {
  AnchorList,
  Nav,
  // NavAnchor, // Parece no usarse
  NavContainer,
  AnchorPlus,
  Anchor,
  AnchorContainer,
} from "@/styles/Nav.module";
import { Icon, iconType } from "../Icons";
import { Container } from "@/styles/index.styles";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  CollectionReference,
  // DocumentSnapshot, // Parece no usarse
  onSnapshot,
  // orderBy, // Parece no usarse
  query,
  QueryDocumentSnapshot,
  where,
  // Firestore, // Import Firestore type if not already implicitly available
} from "firebase/firestore";
import { Firestore as initializeFirestore } from "@/tools/firestore"; // Renombrar para evitar conflicto
import {
  // InvoiceCollection,
  SellersCollection,
} from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
// Importa el hook y el tipo NavElementData si no está ya exportado/importado
import { useInvoiceStatusRealtime } from "@/hooks/useInvoiceStatusRealtime"; // Ajusta la ruta

// Exporta este tipo si lo usas en el hook
export interface NavElementData {
  href: string;
  name: string;
  icon?: iconType;
}

interface NavElement extends NavElementData {
  children?: NavElement[];
}

// Define el tipo 'children' si no está definido globalmente
type children = React.ReactNode;

export function NavLayout({ children }: { children: children }) {
  const [url, setUrl] = useState<Record<string, NavElement>>({
    home: { href: "/feed", name: "Inicio", icon: "home" },
    seller: { href: "/sellers", icon: "seller", name: "Vendedores" },
    products: {
      href: "/products",
      icon: "product",
      name: "Inventarios",
      children: [
        { href: "/products/list", name: "Inventario" },
        { href: "/products/list", name: "Guardo general" },
        { href: "/products/list", name: "Guardo individual" },
      ],
    },
    invoice: {
      href: "/invoices",
      icon: "invoice",
      name: "Facturación",
      children: [
        { name: "Lista de facturas", href: "/invoices" },
        { name: "Crear factura a", href: "/invoices/manage", children: [] }, // Inicialmente vacío
        { name: "Liquidar a", href: "/invoices/manage", children: [] }, // Inicialmente vacío
        {
          name: "Varios",
          href: "/invoices/manage",
          children: [
            { name: "Donaciones", href: "/invoices/manage" },
            { name: "Producto en mal estado", href: "/invoices/manage" },
          ],
        },
      ],
    },
  });
  const [removeMaxWith, setRemoveMaxWith] = useState(false);
  const [sellers, setSellers] = useState<
    Array<QueryDocumentSnapshot<SellersDoc>>
  >([]);
  const { asPath } = useRouter();
  const db = initializeFirestore(); // Inicializa Firestore una vez

  // Efecto para cargar vendedores
  useEffect(() => {
    const coll = collection(
      db,
      SellersCollection.root
    ) as CollectionReference<SellersDoc>;
    const q = query(
      coll,
      where("disabled", "==", false) /* orderBy("name") // Opcional: ordenar */
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedSellers = snap.docs;
      setSellers(fetchedSellers);

      // Actualiza la sección de vendedores directamente aquí
      setUrl((currentUrl) => ({
        ...currentUrl,
        seller: {
          ...currentUrl.seller,
          children: fetchedSellers.map((el) => ({
            name: el.data()?.name ?? `Vendedor ${el.id}`, // Maneja posible data undefined
            href: `/sellers?id=${el.id}`,
          })),
        },
      }));
    });

    return unsubscribe; // Limpia el listener de vendedores
  }, [db]); // Depende de la instancia de db

  // *** USA EL HOOK PERSONALIZADO ***
  const { createInvoiceList, liquidateInvoiceList, isLoading, error } =
    useInvoiceStatusRealtime(db, sellers);

  // Efecto para actualizar los submenús de facturación usando los datos del hook
  useEffect(() => {
    // Opcional: manejar isLoading o error en la UI si es necesario
    if (isLoading) return; // Espera a que el hook termine de cargar
    if (error) {
      console.error("Error from useInvoiceStatusRealtime:", error);
      // Podrías querer limpiar las listas o mostrar un error en la UI
      // setUrl(...)
      return;
    }

    setUrl((currentUrl) => {
      // Encuentra los índices de forma segura
      const invoiceChildren = currentUrl.invoice.children ?? [];
      const createIndex = invoiceChildren.findIndex(
        (child) => child.name === "Crear factura a"
      );
      const liquidateIndex = invoiceChildren.findIndex(
        (child) => child.name === "Liquidar a"
      );

      // Si no se encuentran los elementos, no hagas nada (o loggea un error)
      if (createIndex === -1 || liquidateIndex === -1) {
        console.error("Could not find invoice submenus to update.");
        return currentUrl;
      }

      // Clonar para evitar mutación directa
      const newInvoiceChildren = [...invoiceChildren];

      // Comprobar si realmente hay cambios antes de actualizar el estado
      const createChanged =
        JSON.stringify(newInvoiceChildren[createIndex].children) !==
        JSON.stringify(createInvoiceList);
      const liquidateChanged =
        JSON.stringify(newInvoiceChildren[liquidateIndex].children) !==
        JSON.stringify(liquidateInvoiceList);

      if (!createChanged && !liquidateChanged) {
        return currentUrl; // No hay cambios, evita re-render innecesario
      }

      console.log("Updating invoice submenus...");

      // Actualizar los children
      newInvoiceChildren[createIndex] = {
        ...newInvoiceChildren[createIndex],
        children: createInvoiceList,
      };
      newInvoiceChildren[liquidateIndex] = {
        ...newInvoiceChildren[liquidateIndex],
        children: liquidateInvoiceList,
      };

      return {
        ...currentUrl,
        invoice: {
          ...currentUrl.invoice,
          children: newInvoiceChildren,
        },
      };
    });
  }, [createInvoiceList, liquidateInvoiceList, isLoading, error]); // Depende de los resultados del hook

  // Efecto para removeMaxWith (sin cambios)
  useEffect(() => {
    if (asPath.match("invoices")) {
      setRemoveMaxWith(true);
    } else {
      setRemoveMaxWith(false);
    }
  }, [asPath]);

  return (
    <NavContainer $deployNav={false} $removeMaxWith={removeMaxWith}>
      <Container>
        <Nav>
          {Object.values(url).map((el, i) => (
            <Anchors key={i} {...el} child={false} />
          ))}
        </Nav>
      </Container>
      {children}
    </NavContainer>
  );
}

type anchorProps = NavElement & {
  // Combina los props
  child: boolean;
};

// Componente Anchors (sin cambios significativos, solo limpieza de console.log)
const Anchors = ({ href, name, icon, children, child }: anchorProps) => {
  // console.log(children); // Quitar o usar condicionalmente para depurar

  return (
    <AnchorContainer>
      {/* Si hay hijos, el Anchor principal no debería tener href funcional */}
      <Anchor
        href={!children ? href : undefined}
        onClick={children ? (e) => e.preventDefault() : undefined}
      >
        {icon && <Icon iconType={icon} />}
        {name}
        {children && children.length > 0 && <AnchorPlus />}{" "}
        {/* Mostrar solo si hay hijos */}
      </Anchor>
      {/* Renderiza la lista solo si hay hijos */}
      {children && children.length > 0 && (
        <AnchorList className={child ? "list child" : "list"}>
          {children.map((el, i) => (
            <Anchors key={i} {...el} child />
          ))}
        </AnchorList>
      )}
    </AnchorContainer>
  );
};
