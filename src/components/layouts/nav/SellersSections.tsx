import { useState, useEffect } from "react";
import { NavElement } from ".";
import { Anchors } from "./Anchors";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { filterSellerHasInventory } from "@/tools/sellers/filterHasInventory";

interface props {
  sellers: QueryDocumentSnapshot<SellersDoc>[];
  clients: QueryDocumentSnapshot<client>[];
}

export function SellersNavSection({ sellers, clients }: props) {
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
    const clientsChildrenRecord: Record<string, NavElement> = {};

    filterSellerHasInventory(sellers, true).forEach((el) => {
      const sellerData = el.data();
      const sellerId = el.id;

      // Usa el ID del vendedor como clave para el Record
      sellerChildrenRecord[sellerId] = {
        name: sellerData?.name ?? `Vendedor ${sellerId}`,
        href: `/sellers?id=${sellerId}`,
      };
    });

    clients.forEach((el) => {
      const clientData = el.data();
      const clientId = el.id;

      // Usa el ID del vendedor como clave para el Record
      clientsChildrenRecord[clientId] = {
        name: clientData?.name ?? `Vendedor ${clientId}`,
        href: `/sellers?clientID=${clientId}`,
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
            name: "Vendedores",
            children: sellerChildrenRecord,
          },
          createClient: {
            href: "/sellers/createClient",
            name: "Crear cliente",
          },
          clientsList: {
            href: "clients/list/",
            name: "Clientes",
            children: clientsChildrenRecord,
          },
        },
      },
    }));
  }, [sellers, clients]);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
