import { Select } from "@/components/Inputs/select";
import { useInvoice } from "@/contexts/InvoiceContext";
import {
  // updateDoc, // Se usará en el siguiente paso al llamar a replaceInvoiceBundle
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  DocumentReference,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  CollectionReference,
} from "firebase/firestore";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { creditBundle } from "@/tools/sellers/credits/createBundle";
import { replaceInvoiceBundle } from "@/tools/sellers/credits/replaceInvoiceBundle";
import { SellersDoc } from "@/tools/sellers/create"; // Tipo para SellersDoc
import { Container, FlexContainer } from "@/styles/index.styles";
import { Button } from "@/styles/Form.styles";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { Days } from "../Closing/Data";
// Asumimos que invoice.data().seller_ref es DocumentReference<SellersDoc>
// y que los credit_bundles son una subcolección de 'sellers' o se pueden consultar globalmente con filtro de seller_ref.
// Por ahora, asumiremos una subcolección "credit_bundles" bajo el vendedor.

// Constante para el valor de la opción "Ningún bundle previo"
const NO_PREVIOUS_BUNDLE_VALUE = "__NULL_PREVIOUS_BUNDLE__";
const CREATE_NEW_BUNDLE_VALUE = "__CREATE_NEW_BUNDLE__";

export function Route() {
  const { invoice } = useInvoice();

  const [availableBundles, setAvailableBundles] = useState<
    QueryDocumentSnapshot<creditBundle>[]
  >([]);
  // selectedPreviousBundleId: El bundle que está *actualmente aplicado* o el último confirmado.
  const [selectedPreviousBundleId, setSelectedPreviousBundleId] = useState<
    string | null
  >(null);
  // pendingPreviousBundleId: El bundle seleccionado en el <Select> pero aún no confirmado.
  const [pendingPreviousBundleId, setPendingPreviousBundleId] = useState<
    string | null
  >(null);

  const [isSelectDisabled, setIsSelectDisabled] = useState<boolean>(false);
  const [lockedBundleSnapshot, setLockedBundleSnapshot] =
    useState<DocumentSnapshot<creditBundle> | null>(null);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  useEffect(() => {
    if (!invoice || !invoice.exists()) {
      setIsSelectDisabled(true);
      setAvailableBundles([]);
      setLockedBundleSnapshot(null);
      setSelectedPreviousBundleId(null);
      setPendingPreviousBundleId(null);
      setShowConfirmation(false);
      return;
    }
    const invoiceData = invoice.data();
    const sellerRef = invoiceData?.seller_ref; // DocumentReference<SellersDoc>

    if (!sellerRef) {
      console.warn("Seller reference not found on invoice.");
      setIsSelectDisabled(true);
      setAvailableBundles([]);
      setLockedBundleSnapshot(null);
      setSelectedPreviousBundleId(null);
      setPendingPreviousBundleId(null);
      setShowConfirmation(false);
      return;
    }

    const currentBundleRefOnInvoice = invoiceData?.credit_bundle_ref as
      | DocumentReference<creditBundle>
      | null
      | undefined;

    let unsubscribe = () => {};

    const 작업 = async () => {
      // Resetear confirmación al inicio de cada "trabajo"
      setShowConfirmation(false);

      if (currentBundleRefOnInvoice) {
        try {
          const bundleDoc = await getDoc(currentBundleRefOnInvoice);
          if (bundleDoc.exists()) {
            const bundleData = bundleDoc.data();
            if (bundleData.next_bundle) {
              // El bundle actual de la factura ya está enlazado a un siguiente.
              setIsSelectDisabled(true);
              setLockedBundleSnapshot(bundleDoc);
              setAvailableBundles([]);
              setSelectedPreviousBundleId(bundleDoc.id);
              setPendingPreviousBundleId(bundleDoc.id); // Sincronizar
              return; // No suscribirse a otros bundles.
            } else {
              // Bundle actual existe y no está bloqueado (next_bundle es null)
              setSelectedPreviousBundleId(bundleDoc.id);
              setPendingPreviousBundleId(bundleDoc.id); // Sincronizar
            }
          } else {
            // currentBundleRefOnInvoice existe pero el documento no. Tratar como si no hubiera bundle.
            console.warn(
              `Invoice ${invoice.id} tiene una referencia a un bundle (${currentBundleRefOnInvoice.id}) que no existe.`
            );
            setSelectedPreviousBundleId(null);
            setPendingPreviousBundleId(null);
          }
        } catch (error) {
          console.error("Error fetching current bundle from invoice:", error);
          setIsSelectDisabled(true); // Mejor deshabilitar en caso de error
          setAvailableBundles([]);
          setLockedBundleSnapshot(null);
          setSelectedPreviousBundleId(null); // Resetear en caso de error
          setPendingPreviousBundleId(null);
          return;
        }
      } else {
        // No hay credit_bundle_ref en la factura
        setSelectedPreviousBundleId(null);
        setPendingPreviousBundleId(null);
      }

      // Si llegamos aquí, el Select no está bloqueado por un bundle con next_bundle.
      // Asegurarse que no esté deshabilitado si no está bloqueado
      setIsSelectDisabled(false);
      setLockedBundleSnapshot(null);

      // Asumiendo que 'credit_bundles' es una subcolección de 'sellers'
      const bundlesCollectionRef = collection(
        sellerRef,
        SellersCollection.creditBundles
      ) as CollectionReference<creditBundle>;

      const q = query(
        bundlesCollectionRef,
        where("next_bundle", "==", null),
        where("disabled", "==", false)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setAvailableBundles(
            snapshot.docs as QueryDocumentSnapshot<creditBundle>[]
          );
        },
        (error) => {
          console.error("Error fetching available bundles:", error);
          setAvailableBundles([]);
          setIsSelectDisabled(true); // Deshabilitar en caso de error de carga
        }
      );
    };

    작업();

    return () => {
      unsubscribe();
      // Limpiar el timeout si el componente se desmonta o invoice cambia
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, [invoice]);

  // Lógica para mostrar confirmación, envuelta en debounce
  const showConfirmationLogic = useCallback(
    (currentPendingId: string | null) => {
      if (currentPendingId !== selectedPreviousBundleId) {
        setShowConfirmation(true);
      } else {
        setShowConfirmation(false);
      }
    },
    [selectedPreviousBundleId]
  );

  const selectOptions = useMemo(() => {
    if (isSelectDisabled && lockedBundleSnapshot) {
      const bundleData = lockedBundleSnapshot.data();
      const bundleDate = bundleData?.created_at.toDate().toLocaleDateString();
      const bundleDay =
        Days[bundleData?.created_at.toDate().getDay() as number];

      const displayName = `Lista del ${bundleDay} ${bundleDate} - Enlazado. Selección bloqueada. ${
        process.env.NODE_ENV === "development"
          ? ` (${lockedBundleSnapshot.id.substring(0, 5)})`
          : ""
      }`;
      return [
        {
          name: displayName,
          value: lockedBundleSnapshot.id,
          disabled: true,
          selected: true,
        },
      ];
    }

    const bundleOptions = availableBundles.map((bundleDoc) => {
      const bundleData = bundleDoc.data();
      const bundleDate = bundleData.created_at.toDate().toLocaleDateString();
      const bundleDay = Days[bundleData.created_at.toDate().getDay()];

      const displayName = `Lista del ${bundleDay} ${bundleDate}${
        process.env.NODE_ENV === "development"
          ? ` (${bundleDoc.id.substring(0, 5)})`
          : ""
      }`;
      return {
        name: displayName,
        value: bundleDoc.id,
        selected: pendingPreviousBundleId === bundleDoc.id, // Usar pending para reflejar la selección del UI
      };
    });

    return [
      {
        name: "Crear nueva Lista",
        value: CREATE_NEW_BUNDLE_VALUE,
        selected: pendingPreviousBundleId === CREATE_NEW_BUNDLE_VALUE,
        disabled: isSelectDisabled,
      },
      {
        name: "Ninguna lista previa",
        value: NO_PREVIOUS_BUNDLE_VALUE,
        selected: pendingPreviousBundleId === null, // Usar pending
        disabled: isSelectDisabled, // Si el select está deshabilitado, esta opción también.
      },
      ...bundleOptions,
    ];
  }, [
    availableBundles,
    isSelectDisabled,
    lockedBundleSnapshot,
    pendingPreviousBundleId, // Depender de pending para la UI del Select
  ]);

  const handlePreviousBundleChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    let newSelectedBundleId: string | null;

    if (value === NO_PREVIOUS_BUNDLE_VALUE) newSelectedBundleId = null;
    else if (value === CREATE_NEW_BUNDLE_VALUE)
      newSelectedBundleId = CREATE_NEW_BUNDLE_VALUE;
    else newSelectedBundleId = value;

    // Actualizar el estado local para reflejar la UI inmediatamente
    setPendingPreviousBundleId(newSelectedBundleId);

    // Mostrar/ocultar confirmación directamente
    showConfirmationLogic(newSelectedBundleId);
  };

  const handleCancelChange = () => {
    // Restablecer la selección pendiente a la última selección confirmada/aplicada
    setPendingPreviousBundleId(selectedPreviousBundleId);
    // Ocultar la UI de confirmación
    setShowConfirmation(false);
    // Limpiar cualquier timeout de confirmación pendiente
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
  };

  const handleConfirmChange = async () => {
    if (pendingPreviousBundleId === selectedPreviousBundleId) {
      console.warn("Confirmación llamada cuando no hay cambio real pendiente.");
      setShowConfirmation(false);
      return;
    }
    if (!invoice || !invoice.exists()) {
      console.error("Factura no disponible. No se puede reemplazar el bundle.");
      setShowConfirmation(false);
      return;
    }

    const invoiceData = invoice.data();
    // Asegurarse de que seller_ref es del tipo correcto.
    const sellerRef = invoiceData?.seller_ref as
      | DocumentReference<SellersDoc>
      | undefined;

    if (!sellerRef) {
      console.error(
        "Referencia del vendedor no encontrada en la factura. No se puede reemplazar el bundle."
      );
      setShowConfirmation(false);
      return;
    }

    // Construir la referencia al bundle previo seleccionado
    let previousBundleToLinkRef: DocumentReference<creditBundle> | null = null;
    if (
      pendingPreviousBundleId &&
      pendingPreviousBundleId !== CREATE_NEW_BUNDLE_VALUE && // Si es "Crear nuevo", no hay previo
      pendingPreviousBundleId !== NO_PREVIOUS_BUNDLE_VALUE // Ya manejado por el null inicial
    ) {
      // Usar pendingPreviousBundleId para la acción
      // Asumiendo que 'credit_bundles' es una subcolección de 'sellers'
      previousBundleToLinkRef = doc(
        sellerRef, // La referencia al documento del vendedor
        "credit_bundles", // El nombre de la subcolección
        pendingPreviousBundleId // El ID del documento del bundle
      ) as DocumentReference<creditBundle>;
    }

    setIsReplacing(true);
    setShowConfirmation(false); // Ocultar confirmación al iniciar el reemplazo

    try {
      console.log(
        `Iniciando reemplazo de bundle para factura ${
          invoice.id
        }. Bundle previo a enlazar: ${pendingPreviousBundleId || "ninguno"}`
      );
      await replaceInvoiceBundle({
        invoice_snapshot: invoice, // invoice es QueryDocumentSnapshot<invoiceType>
        seller_ref: sellerRef,
        previous_bundle_to_link_ref: previousBundleToLinkRef,
      });
      // Si tiene éxito, el bundle pendiente se convierte en el aplicado
      setSelectedPreviousBundleId(pendingPreviousBundleId);
      console.log(
        `Bundle reemplazado exitosamente para la factura ${invoice.id}.`
      );
    } catch (error) {
      console.error("Error al reemplazar el bundle de la factura:", error);
      // Si falla, selectedPreviousBundleId no cambia.
      // pendingPreviousBundleId sigue siendo lo que el usuario intentó.
      // La confirmación ya está oculta. El usuario puede reintentar cambiando el select.
    } finally {
      setIsReplacing(false);
    }
  };

  const handleMouseDownConfirm = () => {
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); // Limpiar anterior si existe
    confirmTimeoutRef.current = setTimeout(() => {
      handleConfirmChange();
    }, 5000); // 5 segundos
  };

  const handleMouseUpConfirm = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
  };

  // También cancelar si el mouse sale del botón mientras está presionado
  const handleMouseLeaveConfirm = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
  };

  return (
    <Container>
      <Select
        name="previous_bundle_selector" // Nombre actualizado para reflejar el propósito
        options={selectOptions}
        onChange={handlePreviousBundleChange}
        disabled={isSelectDisabled || isReplacing} // Deshabilitar también si está en proceso de reemplazo
      />
      {showConfirmation && !isReplacing && (
        <Container>
          <FlexContainer
            styles={{ gap: "10px", alignItems: "center", marginBottom: "10px" }}
          >
            <Button
              $warn
              $hold
              onMouseDown={handleMouseDownConfirm}
              onMouseUp={handleMouseUpConfirm}
              onMouseLeave={handleMouseLeaveConfirm} // Para cancelar si el mouse se va
              onTouchStart={handleMouseDownConfirm} // Para soporte táctil
              onTouchEnd={handleMouseUpConfirm} // Para soporte táctil
            >
              Quiero Cambiarlo
            </Button>
            <Button onClick={handleCancelChange}>Cancelar Cambio</Button>
          </FlexContainer>
          <p>
            Al cambiar la lista de creditos referenciada se perderá la
            información ya escrita en ella, esta accion es <b>INRREVERSIBLE</b>,
            tenga precaución.
          </p>
        </Container>
      )}
    </Container>
  );
}
