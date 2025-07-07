import { useEffect, useMemo, useState } from "react";
import { arrayToNavElementRecord, NavElement } from ".";
import { Anchors } from "./Anchors";
import { useInvoiceStatusRealtime } from "@/hooks/useInvoiceStatusRealtime";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";

interface props {
  sellers: QueryDocumentSnapshot<SellersDoc>[];
  clients: QueryDocumentSnapshot<client>[];
}

export function InvoicesNavSection({ sellers, clients }: props) {
  const [url, setUrl] = useState<Record<string, NavElement>>({
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
            donations: {
              name: "Donaciones",
              href: "/invoices/manage?invoice_type=donation",
            },
            damagedProduct: {
              name: "Producto en mal estado",
              href: "/invoices/manage?invoice_type=damaged",
            },
          },
        },
      },
    },
  });
  const { createInvoiceList, liquidateInvoiceList, isLoading, error } =
    useInvoiceStatusRealtime(sellers);

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

      // Crea una nueva copia del objeto children de invoice para la inmutabilidad
      const newInvoiceChildren = { ...currentInvoiceChildren };

      // Actualiza los children de 'create' y 'liquidate' con los nuevos Records
      const office = sellers.find((el) => !el.data().hasInventory);
      if (office) {
        newInvoiceChildren["create"] = {
          ...createChild,
          children: {
            // Ponemos la OFICINA de forma directa para no moverla a la liquidación
            none: {
              href: "/invoices/manage?sellerId=" + office.id,
              name: office.data().name,
              mustBeAnchor: true,
              children: Object.fromEntries(
                clients.map((el) => {
                  return [
                    el.id,
                    {
                      href:
                        "/invoices/manage?sellerId=" +
                        office.id +
                        "&clientId=" +
                        el.id,
                      name: el.data().name,
                      mustBeAnchor: true,
                    },
                  ];
                })
              ),
            },
            ...createInvoiceRecord,
          },
        };
      } else {
        newInvoiceChildren["create"] = {
          ...createChild,
          children: {
            ...createInvoiceRecord,
          },
        };
      }
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
  }, [
    createInvoiceRecord,
    liquidateInvoiceRecord,
    isLoading,
    error,
    clients,
    sellers,
  ]);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
