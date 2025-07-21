import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentReference, // Import DocumentReference
} from "firebase/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { NavElementData } from "@/components/layouts/nav";
import { Firestore } from "@/tools/firestore";

interface InvoiceStatus {
  createInvoiceList: NavElementData[];
  liquidateInvoiceList: NavElementData[];
  isLoading: boolean;
  error: Error | null;
}

// Función auxiliar para obtener la fecha actual en formato YYYY-MM-DD
const getCurrentDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

export function useInvoiceStatusRealtime(
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>
): InvoiceStatus {
  const [status, setStatus] = useState<InvoiceStatus>({
    createInvoiceList: [],
    liquidateInvoiceList: [],
    isLoading: true,
    error: null,
  });
  const [currentDateStr, setCurrentDateStr] = useState(getCurrentDateString());

  useEffect(() => {
    if (sellers.length === 0) {
      setStatus({
        createInvoiceList: [],
        liquidateInvoiceList: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    const sellersWithInventory = sellers.filter((sellerDoc) => {
      const sellerData = sellerDoc.data();
      return sellerData?.hasInventory;
    });

    const sellersToQuery = sellersWithInventory.slice(0, 30);
    if (sellersWithInventory.length > 30) {
      console.warn(
        "Hook: Listening only to the first 30 sellers with inventory..."
      );
    }
    const sellerRefsToQuery: DocumentReference[] = sellersToQuery
      .map((doc) => doc.ref)
      .filter((ref): ref is DocumentReference<SellersDoc> => ref !== undefined);

    if (sellerRefsToQuery.length === 0) {
      setStatus({
        createInvoiceList: [],
        liquidateInvoiceList: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    const baseDate = new Date(currentDateStr + "T00:00:00");
    const startOfDay = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      23,
      59,
      59,
      999
    );
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    console.log(`Setting up listener for date: ${currentDateStr}`);

    const db = Firestore();
    const invoiceColl = collection(db, InvoiceCollection.root);
    const q = query(
      invoiceColl,
      where("seller_ref", "in", sellerRefsToQuery),
      where("created_at", ">=", startOfDayTimestamp),
      where("created_at", "<=", endOfDayTimestamp),
      where("disabled", "==", false)
    );

    setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    const unsubscribe = onSnapshot(
      q,
      // --- Inicio: Implementación de la Solución 3 ---
      (querySnapshot) => {
        // 1. Crear mapa de Seller ID a Invoice ID
        const sellerInvoiceMap = new Map<string, string>();
        querySnapshot.forEach((doc) => {
          const invoiceData = doc.data();
          // Asegúrate que seller_ref y su id existen, y que doc.id (invoiceId) también existe
          if (invoiceData?.seller_ref?.id && doc.id) {
            sellerInvoiceMap.set(invoiceData.seller_ref.id, doc.id);
          }
        });

        const createList: NavElementData[] = [];
        const liquidateList: NavElementData[] = [];

        // 2. Iterar sobre los vendedores a consultar
        sellersToQuery.forEach((sellerDoc) => {
          const sellerId = sellerDoc.id;
          const sellerData = sellerDoc.data();
          const sellerName = sellerData?.name ?? `Vendedor ${sellerId}`;
          const invoiceId = sellerInvoiceMap.get(sellerId); // Obtener ID de factura si existe

          // 3. Construir el objeto NavElementData con el href correcto
          const sellerNavItem: NavElementData = {
            name: sellerName,
            href: invoiceId // ¿Existe ID de factura para este vendedor?
              ? `/invoices/manage?id=${invoiceId}` // Sí: usa el ID de la factura
              : `/invoices/manage?sellerId=${sellerId}`, // No: usa el ID del vendedor
            // mustBeAnchor: true,
          };

          // 4. Añadir el elemento a la lista correspondiente basado en si había invoiceId
          if (invoiceId) {
            liquidateList.push(sellerNavItem); // Vendedor con factura -> Liquidar
          } else {
            createList.push(sellerNavItem); // Vendedor sin factura -> Crear
          }
        });

        // 5. Actualizar el estado
        setStatus({
          createInvoiceList: createList,
          liquidateInvoiceList: liquidateList,
          isLoading: false,
          error: null,
        });
      },
      // --- Fin: Implementación de la Solución 3 ---
      (err) => {
        console.error(
          `Error in useInvoiceStatusRealtime listener for ${currentDateStr}:`,
          err
        );
        setStatus((prev) => ({ ...prev, isLoading: false, error: err }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sellers, currentDateStr]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const todayStr = getCurrentDateString();
      setCurrentDateStr((prevDateStr) => {
        if (prevDateStr !== todayStr) {
          console.log("Day changed, updating date state.");
          return todayStr;
        }
        return prevDateStr;
      });
    }, 1 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return status;
}
