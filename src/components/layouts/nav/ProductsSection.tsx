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
    products: {
      href: "/products",
      icon: "product",
      name: "Inventario",
      children: {
        addOrEdit: {
          href: "/products/create",
          name: "Añadir o Editar",
        },
        // entriesANDoutputs: {
        //   href: "/products/inventory/manage",
        //   name: "Entradas y salidas",
        // },
        currentInventory: {
          href: "/products/inventory",
          name: "Inventario actual",
        },
        individualStorage: {
          href: "/products/inventory/sellers",
          name: "Guardo individual",
          children: {},
        },
        generalStorage: {
          href: "/products/inventory/sellers",
          name: "Guardo general",
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
