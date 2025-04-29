// src/components/layouts/nav.layout.tsx
import {
  AnchorList,
  Nav,
  NavContainer,
  AnchorPlus,
  Anchor,
  AnchorContainer,
} from "@/styles/Nav.module";
import { Icon, iconType } from "../Icons";
import { Container } from "@/styles/index.styles";
import { useEffect, useState, useMemo } from "react"; // Import useMemo
import { useRouter } from "next/router";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { Firestore as initializeFirestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { useInvoiceStatusRealtime } from "@/hooks/useInvoiceStatusRealtime";

// Interfaz actualizada para NavElementData (sin cambios aquí)
export interface NavElementData {
  href: string;
  name: string;
  icon?: iconType;
}

// Interfaz NavElement actualizada con children como Record
interface NavElement extends NavElementData {
  // 👇 Children ahora es un Record o undefined
  children?: Record<string, NavElement>;
}

// Define el tipo 'children' si no está definido globalmente
type children = React.ReactNode;

// --- Helper function para convertir array a Record ---
// (Puedes moverla a un archivo de utilidades si prefieres)
const arrayToNavElementRecord = (
  arr: NavElementData[],
  keyPrefix: string = "item" // Prefijo para las claves generadas
): Record<string, NavElement> => {
  const record: Record<string, NavElement> = {};
  arr.forEach((item, index) => {
    // Usar un prefijo y el índice como clave. Considera usar item.href o un id si es más estable/único.
    const key = `${keyPrefix}-${item.href || index}`; // Usar href si existe, sino índice
    record[key] = { ...item }; // Copia las propiedades de NavElementData
  });
  return record;
};
// --- Fin Helper function ---

export function NavLayout({ children }: { children: children }) {
  // Estado inicial actualizado para usar Record en children
  const [url, setUrl] = useState<Record<string, NavElement>>({
    home: { href: "/feed", name: "Inicio", icon: "home" },
    seller: {
      href: "/sellers",
      icon: "seller",
      name: "Vendedores",
      children: {}, // Inicialmente vacío, se llenará desde Firestore
    },
    products: {
      href: "/products",
      icon: "product",
      name: "Inventarios",
      children: {
        // 👇 Claves descriptivas para cada hijo
        inventoryList: { href: "/products/list", name: "Inventario" },
        generalStorage: { href: "/products/list", name: "Guardo general" },
        individualStorage: {
          href: "/products/list",
          name: "Guardo individual",
        },
      },
    },
    invoice: {
      href: "/invoices",
      icon: "invoice",
      name: "Facturación",
      children: {
        // 👇 Claves descriptivas para cada hijo
        list: { name: "Lista de facturas", href: "/invoices" },
        create: {
          name: "Crear factura a",
          href: "/invoices/manage",
          children: {},
        }, // Inicialmente vacío
        liquidate: {
          name: "Liquidar a",
          href: "/invoices/manage",
          children: {},
        }, // Inicialmente vacío
        various: {
          name: "Varios",
          href: "/invoices/manage",
          children: {
            donations: { name: "Donaciones", href: "/invoices/manage" },
            damagedProduct: {
              name: "Producto en mal estado",
              href: "/invoices/manage",
            },
          },
        },
      },
    },
  });
  const [removeMaxWith, setRemoveMaxWith] = useState(false);
  // El estado de sellers sigue siendo un array de snapshots
  const [sellers, setSellers] = useState<
    Array<QueryDocumentSnapshot<SellersDoc>>
  >([]);
  const { asPath } = useRouter();
  const db = initializeFirestore();

  // Efecto para cargar vendedores y actualizar el submenú 'seller'
  useEffect(() => {
    const coll = collection(
      db,
      SellersCollection.root
    ) as CollectionReference<SellersDoc>;
    const q = query(coll, where("disabled", "==", false));

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedSellers = snap.docs;
      setSellers(fetchedSellers); // Actualiza el estado de sellers (si aún lo necesitas)

      // Crea el Record para los children de 'seller'
      const sellerChildrenRecord: Record<string, NavElement> = {};
      fetchedSellers.forEach((el) => {
        const sellerData = el.data();
        const sellerId = el.id;
        // Usa el ID del vendedor como clave para el Record
        sellerChildrenRecord[sellerId] = {
          name: sellerData?.name ?? `Vendedor ${sellerId}`,
          href: `/sellers?id=${sellerId}`,
        };
      });

      // Actualiza la URL con el nuevo Record de vendedores
      setUrl((currentUrl) => ({
        ...currentUrl,
        seller: {
          ...currentUrl.seller,
          children: sellerChildrenRecord, // Asigna el Record creado
        },
      }));
    });

    return unsubscribe;
  }, [db]); // Dependencia: db

  // Hook para obtener datos de facturas en tiempo real
  const { createInvoiceList, liquidateInvoiceList, isLoading, error } =
    useInvoiceStatusRealtime(db, sellers);

  // Memoiza la conversión de arrays a Records para evitar recálculos innecesarios
  const createInvoiceRecord = useMemo(
    () => arrayToNavElementRecord(createInvoiceList, "create"),
    [createInvoiceList]
  );
  const liquidateInvoiceRecord = useMemo(
    () => arrayToNavElementRecord(liquidateInvoiceList, "liquidate"),
    [liquidateInvoiceList]
  );

  // Efecto para actualizar los submenús de facturación ('create' y 'liquidate')
  useEffect(() => {
    if (isLoading) return; // Espera si está cargando
    if (error) {
      console.error("Error from useInvoiceStatusRealtime:", error);
      // Considera limpiar los submenús o mostrar un error
      // setUrl(...)
      return;
    }

    setUrl((currentUrl) => {
      // Accede a los hijos de invoice usando las claves definidas
      const currentInvoiceChildren = currentUrl.invoice.children ?? {};
      const createChild = currentInvoiceChildren["create"];
      const liquidateChild = currentInvoiceChildren["liquidate"];

      // Verifica si los elementos existen antes de intentar actualizarlos
      if (!createChild || !liquidateChild) {
        console.warn(
          "Invoice submenus ('create' or 'liquidate') not found in state. Skipping update."
        );
        return currentUrl; // No se encontraron los elementos, no actualiza
      }

      // Compara los records actuales con los nuevos (usando JSON.stringify es simple pero puede ser ineficiente)
      // Una comparación profunda sería más robusta si la estructura es compleja.
      const createChanged =
        JSON.stringify(createChild.children) !==
        JSON.stringify(createInvoiceRecord);
      const liquidateChanged =
        JSON.stringify(liquidateChild.children) !==
        JSON.stringify(liquidateInvoiceRecord);

      // Si no hay cambios, retorna el estado actual para evitar re-renderizados
      if (!createChanged && !liquidateChanged) {
        return currentUrl;
      }

      console.log("Updating invoice submenus ('create' and 'liquidate')...");

      // Crea una nueva copia del objeto children de invoice para la inmutabilidad
      const newInvoiceChildren = { ...currentInvoiceChildren };

      // Actualiza los children de 'create' y 'liquidate' con los nuevos Records
      newInvoiceChildren["create"] = {
        ...createChild,
        children: createInvoiceRecord,
      };
      newInvoiceChildren["liquidate"] = {
        ...liquidateChild,
        children: liquidateInvoiceRecord,
      };

      // Retorna el nuevo estado de la URL
      return {
        ...currentUrl,
        invoice: {
          ...currentUrl.invoice,
          children: newInvoiceChildren,
        },
      };
    });
    // Dependencias: los Records memoizados, isLoading y error
  }, [createInvoiceRecord, liquidateInvoiceRecord, isLoading, error]);

  // Efecto para removeMaxWith (sin cambios)
  useEffect(() => {
    setRemoveMaxWith(asPath.includes("/invoices")); // Simplificado
  }, [asPath]);

  return (
    <NavContainer $deployNav={false} $removeMaxWith={removeMaxWith}>
      <Container>
        <Nav>
          {/* Itera sobre los valores del objeto url */}
          {Object.values(url).map((el) => (
            // Usa una clave única, por ejemplo el href o name
            <Anchors key={el.href || el.name} {...el} child={false} />
          ))}
        </Nav>
      </Container>
      {children}
    </NavContainer>
  );
}

// Props para el componente Anchors (sin cambios)
type anchorProps = NavElement & {
  child: boolean;
};

// Componente Anchors actualizado para manejar children como Record
const Anchors = ({ href, name, icon, children, child }: anchorProps) => {
  // Verifica si hay hijos usando Object.keys y su longitud
  const hasChildren = children && Object.keys(children).length > 0;

  return (
    <AnchorContainer>
      <Anchor
        href={!hasChildren ? href : undefined} // El enlace principal no es navegable si tiene hijos
        onClick={hasChildren ? (e) => e.preventDefault() : undefined} // Previene navegación si hay hijos
      >
        {icon && <Icon iconType={icon} />}
        {name}
        {/* Muestra el icono '+' solo si hay hijos */}
        {hasChildren && <AnchorPlus />}
      </Anchor>
      {/* Renderiza la lista solo si hay hijos */}
      {hasChildren && (
        <AnchorList className={child ? "list child" : "list"}>
          {/* Itera sobre los *valores* del Record children */}
          {Object.values(children).map((el) => (
            // Usa una clave única, por ejemplo el href o name
            <Anchors key={el.href || el.name} {...el} child />
          ))}
        </AnchorList>
      )}
    </AnchorContainer>
  );
};
