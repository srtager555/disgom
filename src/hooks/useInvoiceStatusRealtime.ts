import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  Firestore,
  QueryDocumentSnapshot,
  DocumentReference, // Import DocumentReference
} from "firebase/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { NavElementData } from "@/components/layouts/nav.layout"; // Asegúrate que la ruta sea correcta

interface InvoiceStatus {
  createInvoiceList: NavElementData[];
  liquidateInvoiceList: NavElementData[];
  isLoading: boolean;
  error: Error | null;
}

// --- Inicio: Soluciones para el cambio de día ---
// Función auxiliar para obtener la fecha actual en formato YYYY-MM-DD
const getCurrentDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};
// --- Fin: Soluciones para el cambio de día ---

export function useInvoiceStatusRealtime(
  db: Firestore,
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>
): InvoiceStatus {
  const [status, setStatus] = useState<InvoiceStatus>({
    createInvoiceList: [],
    liquidateInvoiceList: [],
    isLoading: true,
    error: null,
  });

  // --- Solución Cambio Día 3: Estado para la fecha actual ---
  const [currentDateStr, setCurrentDateStr] = useState(getCurrentDateString());
  // --- Fin Solución Cambio Día 3 ---

  useEffect(() => {
    // --- Solución Cambio Día 1: Interval Check (dentro del efecto) ---
    /*
    const intervalId = setInterval(() => {
        const todayStr = getCurrentDateString();
        // Si la fecha almacenada en el estado es diferente a la actual, actualiza el estado.
        // Esto hará que el useEffect se vuelva a ejecutar porque currentDateStr es una dependencia.
        setCurrentDateStr(prevDateStr => {
            if (prevDateStr !== todayStr) {
                console.log("Day changed, forcing effect re-run.");
                return todayStr;
            }
            return prevDateStr;
        });
    // Revisa cada 5 minutos (ajusta según necesidad)
    }, 5 * 60 * 1000);
    */
    // --- Fin Solución Cambio Día 1 ---

    // --- Solución Cambio Día 2: Focus/Visibility Check ---
    /*
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            console.log("Tab became visible, checking date...");
            const todayStr = getCurrentDateString();
             setCurrentDateStr(prevDateStr => {
                if (prevDateStr !== todayStr) {
                    console.log("Day changed while tab hidden, forcing effect re-run.");
                    return todayStr;
                }
                return prevDateStr;
            });
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    */
    // --- Fin Solución Cambio Día 2 ---

    if (sellers.length === 0) {
      setStatus({
        createInvoiceList: [],
        liquidateInvoiceList: [],
        isLoading: false,
        error: null,
      });
      // Limpiar timers/listeners si se usan las otras soluciones
      // clearInterval(intervalId); // Para Solución 1
      // document.removeEventListener('visibilitychange', handleVisibilityChange); // Para Solución 2
      return;
    }

    const sellersToQuery = sellers.slice(0, 30);
    if (sellers.length > 30) {
      console.warn("Hook: Listening only to the first 30 sellers...");
    }
    // Asegúrate que seller.ref existe y es del tipo correcto
    const sellerRefsToQuery: DocumentReference[] = sellersToQuery
      .map((doc) => doc.ref)
      .filter((ref): ref is DocumentReference<SellersDoc> => ref !== undefined); // Filtra posibles undefined y asegura tipo

    if (sellerRefsToQuery.length === 0) {
      setStatus({
        createInvoiceList: [],
        liquidateInvoiceList: [],
        isLoading: false,
        error: null,
      });
      // Limpiar timers/listeners
      // clearInterval(intervalId); // Para Solución 1
      // document.removeEventListener('visibilitychange', handleVisibilityChange); // Para Solución 2
      return;
    }

    // Calcula las fechas basándose en la fecha actual del estado (o la real si no usas estado de fecha)
    const baseDate = new Date(currentDateStr + "T00:00:00"); // Usa la fecha del estado para consistencia
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

    console.log(`Setting up listener for date: ${currentDateStr}`); // Log para ver qué día escucha

    const invoiceColl = collection(db, InvoiceCollection.root);
    const q = query(
      invoiceColl,
      where("seller_ref", "in", sellerRefsToQuery),
      where("created_at", ">=", startOfDayTimestamp),
      where("created_at", "<=", endOfDayTimestamp)
    );

    setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log(`Snapshot received for ${currentDateStr}`);
        const sellersWithInvoiceToday = new Set<string>();
        querySnapshot.forEach((doc) => {
          const invoiceData = doc.data();
          if (invoiceData.seller_ref && invoiceData.seller_ref.id) {
            sellersWithInvoiceToday.add(invoiceData.seller_ref.id);
          }
        });

        const createList: NavElementData[] = [];
        const liquidateList: NavElementData[] = [];
        sellersToQuery.forEach((sellerDoc) => {
          const sellerData = sellerDoc.data();
          // Asegúrate que sellerData existe antes de acceder a 'name'
          const sellerName = sellerData?.name ?? `Vendedor ${sellerDoc.id}`;
          const sellerNavItem = {
            name: sellerName,
            href: `/invoices/manage?sellerId=${sellerDoc.id}`,
          };
          if (sellersWithInvoiceToday.has(sellerDoc.id)) {
            liquidateList.push(sellerNavItem);
          } else {
            createList.push(sellerNavItem);
          }
        });

        setStatus({
          createInvoiceList: createList,
          liquidateInvoiceList: liquidateList,
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        console.error(
          `Error in useInvoiceStatusRealtime listener for ${currentDateStr}:`,
          err
        );
        setStatus((prev) => ({ ...prev, isLoading: false, error: err }));
      }
    );

    // Limpieza del efecto
    return () => {
      console.log(`Unsubscribing listener for ${currentDateStr}`);
      unsubscribe();
      // Limpiar timers/listeners si se usan las otras soluciones
      // clearInterval(intervalId); // Para Solución 1
      // document.removeEventListener('visibilitychange', handleVisibilityChange); // Para Solución 2
    };

    // Dependencias: db, sellers y la fecha actual (para Solución 3)
  }, [db, sellers, currentDateStr]); // <--- currentDateStr añadido aquí para Solución 3

  // --- Solución Cambio Día 3: Intervalo para actualizar la fecha ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      const todayStr = getCurrentDateString();
      // Actualiza el estado SOLO si la fecha realmente cambió
      setCurrentDateStr((prevDateStr) => {
        if (prevDateStr !== todayStr) {
          console.log("Day changed, updating date state.");
          return todayStr;
        }
        return prevDateStr; // No hay cambio, no actualiza estado, no re-ejecuta el efecto principal
      });
      // Revisa cada minuto (más frecuente que en Solución 1 porque solo actualiza si hay cambio)
    }, 1 * 60 * 1000);

    return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el hook
  }, []); // Este efecto solo se ejecuta una vez al montar el hook
  // --- Fin Solución Cambio Día 3 ---

  return status;
}
