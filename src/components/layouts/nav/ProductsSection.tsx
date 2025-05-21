import { useEffect, useState } from "react";
import { Anchors } from "./Anchors";
import { NavElement } from ".";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";

interface props {
  sellers: QueryDocumentSnapshot<SellersDoc>[];
}

export function ProductNavSection({ sellers }: props) {
  const [url, setUrl] = useState<Record<string, NavElement>>({
    // home: { href: "/feed", name: "Inicio", icon: "home" },

    products: {
      href: "/products",
      icon: "product",
      name: "Inventarios",
      children: {
        inventoryList: {
          href: "/products/inventory",
          name: "Inventario",
          children: {
            inventory: {
              href: "/products/inventory",
              name: "Inventario actual",
            },
            addStock: {
              href: "/products/inventory/manage",
              name: "Entradas y salidas",
            },
          },
        },
        generalStorage: {
          href: "/products/inventory/sellers",
          name: "Guardo general",
        },
        individualStorage: {
          href: "/products/inventory/sellers",
          name: "Guardo individual",
          children: {},
        },
        products: {
          href: "/products/",
          name: "Lista de productos",
          children: {
            addOrEdit: {
              href: "/products/create",
              name: "Añadir o editar",
            },
            detailed: {
              href: "/products/detailed",
              name: "Información detallada",
            },
          },
        },
      },
    },
  });

  useEffect(() => {
    // Crea el Record para los children de 'seller'
    const sellerInvotoriesRecord: Record<string, NavElement> = {};

    sellers.forEach((el) => {
      const sellerData = el.data();
      const sellerId = el.id;

      if (!sellerData?.hasInventory) return;

      sellerInvotoriesRecord[sellerId] = {
        name: sellerData?.name ?? `Vendedor ${sellerId}`,
        href: `/products/inventory/by-seller?id=${sellerId}`,
      };
    });

    // Actualiza la URL con el nuevo Record de vendedores
    setUrl((currentUrl) => ({
      ...currentUrl,
      products: {
        ...currentUrl.products,
        children: {
          ...currentUrl.products.children,
          individualStorage: {
            ...((currentUrl.products.children ?? {}).individualStorage ?? {}),
            children: sellerInvotoriesRecord,
          },
        },
      },
    }));
  }, [sellers]);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
