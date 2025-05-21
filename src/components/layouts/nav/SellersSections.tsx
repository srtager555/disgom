import { useState, useEffect } from "react";
import { NavElement } from ".";
import { Anchors } from "./Anchors";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";

interface props {
  sellers: QueryDocumentSnapshot<SellersDoc>[];
}

export function SellersNavSection({ sellers }: props) {
  const [url, setUrl] = useState<Record<string, NavElement>>({
    seller: {
      href: "/sellers",
      icon: "seller",
      name: "Vendedores",
      children: {
        create: {
          href: "/sellers/create",
          name: "Crear vendedor",
        },
      }, // Inicialmente vacío, se llenará desde Firestore
    },
  });

  useEffect(() => {
    // Crea el Record para los children de 'seller'
    const sellerChildrenRecord: Record<string, NavElement> = {};

    sellers.forEach((el) => {
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
        children: {
          ...currentUrl.seller.children,
          sellersList: {
            href: "sellers/list/",
            name: "Lista de vendedores",
            children: sellerChildrenRecord,
          },
        },
      },
    }));
  }, [sellers]);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
