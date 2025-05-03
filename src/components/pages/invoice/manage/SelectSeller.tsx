import { Select } from "@/components/Inputs/select";
import { useInvoice } from "@/contexts/InvoiceContext";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { FlexContainer } from "@/styles/index.styles";
// --- Añadir importaciones ---
import {
  createInvoice /* invoiceType */,
} from "@/tools/invoices/createInvoice"; // Asegúrate que la ruta sea correcta
import { updateInvoice } from "@/tools/invoices/updateInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router"; // Importar useRouter
import styled from "styled-components";

type SelectSellerProps = {
  setSelectedSeller: Dispatch<
    SetStateAction<QueryDocumentSnapshot<SellersDoc> | undefined>
  >;
  // Cambiado a DocumentSnapshot para permitir undefined inicial
  currentSeller: DocumentSnapshot<SellersDoc> | undefined;
};

const SelectContainer = styled(FlexContainer)<{ column?: boolean }>`
  flex-direction: ${(props) => (props.column ? "column" : "row")};
  align-items: center;
  justify-content: center;

  & > div select {
    font-size: 1.5rem;
    margin-left: ${(props) => (props.column ? "0px" : "12px")};
  }
`;

const Fieldset = styled.fieldset`
  padding: 5px 15px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;

  legend {
    font-weight: bold;
    padding: 0px 10px;
  }

  div label {
    cursor: pointer;
  }

  div input {
    display: inline-block;
    margin-right: 5px;
  }
`;

// --- Tipos (sin cambios) ---
type InvoiceTypeOption = "normal" | "donation" | "damaged"; // Renombrado para claridad

export function SelectSeller({
  setSelectedSeller,
  currentSeller,
}: SelectSellerProps) {
  const { invoice } = useInvoice();
  // NUEVO: Obtener 'id' y 'invoice_type' de los query params
  const { id: queryId, invoice_type: queryInvoiceType } = useQueryParams();
  const router = useRouter(); // Hook para redirección
  const [isCreating, setIsCreating] = useState(false); // Estado para prevenir doble creación

  const seller_id = useMemo(() => invoice?.data().seller_ref.id, [invoice]);
  const sellers = useGetSellers();
  const [lastSellerID, setLastSellerID] = useState<string>();

  // --- Estado local para el tipo de factura ---
  // Estado local para el tipo de factura, inicializado con prioridad:
  // 1. Tipo de la factura cargada
  // 2. Tipo del query param (si no hay factura cargada aún)
  // 3. Default 'normal'
  const [selectedInvoiceType, setSelectedInvoiceType] =
    useState<InvoiceTypeOption>(
      () =>
        invoice?.data().invoice_type ||
        (queryInvoiceType as InvoiceTypeOption) ||
        "normal"
    );

  // --- Función centralizada para crear y redirigir (Opción 2) ---
  const handleCreateInvoiceIfNeeded = useCallback(
    async (type: InvoiceTypeOption) => {
      // Solo proceder si NO hay factura, el tipo NO es normal y NO se está creando
      if (!invoice && type !== "normal" && !isCreating) {
        console.log(`Intentando crear factura tipo '${type}'...`);
        setIsCreating(true);
        try {
          // --- Aquí va tu lógica para crear la factura ---
          const newInvoiceRef = await createInvoice({ invoice_type: type });
          console.log("Factura con el id", newInvoiceRef?.id);
          if (!newInvoiceRef) {
            setIsCreating(false);
            return false;
          }
          console.log(newInvoiceRef.id);

          console.log("Factura creada con ID:", newInvoiceRef.id);
          router.push(`/invoices/manage?id=${newInvoiceRef.id}`);

          return true; // Indica que se intentó crear (y se redirigió)
        } catch (error) {
          console.error(`Error al crear factura tipo '${type}':`, error);
          setIsCreating(false); // Resetear en caso de error
          return false; // Indica que falló la creación
        }
      }
      return false; // Indica que no se necesitaba crear o ya se estaba creando
    },
    [invoice, isCreating, router /*, createInvoice */] // Dependencias
  );

  // --- Efecto para crear al montar si hay query param != 'normal' y NO hay factura ---
  useEffect(() => {
    // Solo si NO hay factura cargada y hay un query param de tipo válido
    if (!invoice && queryInvoiceType) {
      handleCreateInvoiceIfNeeded(queryInvoiceType as InvoiceTypeOption);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInvoiceType, invoice /*, handleCreateInvoiceIfNeeded */]); // Depende de invoice para no ejecutarse si ya hay una

  // --- Sincroniza el estado local si la factura del contexto cambia ---
  useEffect(() => {
    const currentInvoiceType = invoice?.data().invoice_type;
    // Si hay un tipo en la factura y es diferente al estado local, actualiza el estado local
    if (currentInvoiceType && currentInvoiceType !== selectedInvoiceType) {
      setSelectedInvoiceType(currentInvoiceType);
    }
    // Si NO hay factura cargada Y el estado local NO es 'normal' (posiblemente por query param inicial)
    // Y el query param TAMPOCO es 'normal', mantenemos el estado local.
    // Si NO hay factura Y el estado local NO es 'normal' PERO el query param SÍ es 'normal' o no existe,
    // reseteamos a 'normal'.
    else if (
      !invoice &&
      selectedInvoiceType !== "normal" &&
      (!queryInvoiceType || queryInvoiceType === "normal")
    ) {
      setSelectedInvoiceType("normal");
    }
  }, [invoice, selectedInvoiceType, queryInvoiceType]); // Añadido queryInvoiceType a dependencias

  // --- Funciones de ayuda (sin cambios) ---
  const findTheSeller = useCallback(
    (id: string) => {
      if (id === "" || !sellers) return;
      return sellers.docs.find((el) => el.id === id);
    },
    [sellers]
  );
  const selectSeller = useCallback(
    (e: ChangeEvent<HTMLSelectElement> | string) => {
      const value = typeof e === "string" ? e : e.target.value;
      const selectedSeller = findTheSeller(value);

      setSelectedSeller(selectedSeller);
      setLastSellerID(value);
    },
    [findTheSeller, setSelectedSeller]
  );

  // --- Handler de selección (llama a crear si no hay factura, o actualiza si la hay) ---
  async function handlerSelectInvoiceType(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value as InvoiceTypeOption;
    setSelectedInvoiceType(value); // Actualiza estado local inmediatamente

    // Intenta crear si es necesario (SOLO si no hay factura)
    const didAttemptCreate = await handleCreateInvoiceIfNeeded(value);

    // Si NO se intentó crear (porque ya había factura o era tipo normal) Y hay una factura existente, actualiza
    if (!didAttemptCreate && invoice) {
      try {
        await updateInvoice(invoice.id, {
          invoice_type: value, // Actualiza el tipo en la factura existente
        });
      } catch (error) {
        console.error("Error updating invoice type:", error);
        setSelectedInvoiceType(invoice?.data().invoice_type || "normal"); // Revertir en caso de error
      }
    } else if (didAttemptCreate === false && !invoice && value !== "normal") {
      // Si falló la creación (y no había factura), revertir la selección visual
      setSelectedInvoiceType("normal");
    }
  }

  // effect to set a seller if there is a current seller
  useEffect(() => {
    if (currentSeller && currentSeller.id !== lastSellerID) {
      selectSeller(currentSeller.id);
    }
  }, [currentSeller, lastSellerID, selectSeller]);

  // effect to select the seller when the invoice is already created
  // y deseleccionar si el tipo no es normal y no hay vendedor
  useEffect(() => {
    // Si hay un seller_id de la factura cargada, selecciónalo
    if (seller_id) {
      setSelectedSeller(findTheSeller(seller_id));
    }
    // NUEVO: Si no hay seller_id (factura nueva o sin vendedor aún) Y el tipo NO es normal,
    // asegúrate de que no haya vendedor seleccionado en el estado padre.
    else if (!seller_id && selectedInvoiceType !== "normal") {
      setSelectedSeller(undefined);
    }
  }, [findTheSeller, seller_id, setSelectedSeller, selectedInvoiceType]); // Añadido selectedInvoiceType

  // --- Helper para obtener el título legible del tipo de factura ---
  const getInvoiceTypeTitle = (type: InvoiceTypeOption): string => {
    switch (type) {
      case "donation":
        return "Factura de Donación";
      case "damaged":
        return "Factura de Productos Dañados";
      default:
        return "Factura Normal"; // O podrías devolver un string vacío si no quieres título para 'normal'
    }
  };

  // --- Renderizado ---
  return (
    <FlexContainer
      styles={{
        justifyContent: queryId ? "center" : "space-between", // Mantiene la separación general
        flexDirection: "row-reverse", // Mantiene el orden Select - Fieldset
        width: "100%",
        maxWidth: "1100px",
        gap: "10px",
        alignItems: "flex-start", // Alinea los items arriba
      }}
    >
      {!queryId && (
        <Fieldset>
          <legend>Seleccione el tipo de factura:</legend>
          <div>
            <label>
              <input
                type="radio"
                name="invoice_type"
                onChange={handlerSelectInvoiceType}
                value="normal"
                // Ahora usa el estado local para checked
                checked={selectedInvoiceType === "normal"}
              />
              Normal
            </label>
          </div>

          <div>
            <label>
              <input
                type="radio"
                name="invoice_type"
                onChange={handlerSelectInvoiceType}
                value="donation"
                // Ahora usa el estado local para checked
                checked={selectedInvoiceType === "donation"}
              />
              Donación
            </label>
          </div>

          <div>
            <label>
              <input
                type="radio"
                name="invoice_type" // Corregido
                onChange={handlerSelectInvoiceType}
                value="damaged"
                // Ahora usa el estado local para checked
                checked={selectedInvoiceType === "damaged"}
              />
              Productos dañados
            </label>
          </div>
        </Fieldset>
      )}

      {/* Contenedor para el Select o el Título */}
      <SelectContainer
        column={!currentSeller && selectedInvoiceType === "normal"} // Solo columna si no hay vendedor Y es normal
      >
        {/* NUEVO: Condicional para mostrar título o select */}
        {queryId !== undefined && selectedInvoiceType !== "normal" ? (
          // Si hay ID y el tipo NO es normal, muestra el título
          <h1 style={{ margin: "0", textAlign: "center" }}>
            {getInvoiceTypeTitle(selectedInvoiceType)}
          </h1>
        ) : (
          // Si NO hay ID O el tipo ES normal, muestra el contenido anterior (Select y texto)
          <>
            {currentSeller ? (
              <h1 style={{ margin: "0", textAlign: "center" }}>Factura de</h1>
            ) : (
              <>
                <h1 style={{ textAlign: "center" }}>
                  ¡Es hora de crear una factura!
                </h1>
                <p>Selecciona un vendedor para crear una factura</p>
              </>
            )}
            <Select
              marginBottom="0px"
              onChange={selectSeller}
              // Deshabilitado si se está creando, O si hay factura Y el tipo NO es normal
              disabled={
                isCreating || (!!invoice && selectedInvoiceType !== "normal")
              }
              options={
                !sellers
                  ? [{ name: "Cargando...", value: "" }]
                  : [
                      {
                        name: "--Elegir",
                        value: "",
                        selected: true,
                        disabled: true,
                      },
                      {
                        name: "--No Aplica",
                        value: "none",
                        // Deshabilitado y seleccionado si hay factura Y el tipo NO es normal
                        disabled: !!invoice && selectedInvoiceType !== "normal",
                        selected: !!invoice && selectedInvoiceType !== "normal",
                      },
                      ...sellers.docs.map((el) => {
                        const data = el.data();
                        return {
                          name: data.name,
                          value: el.id,
                          // Seleccionado si el tipo NO es normal (entonces no aplica está seleccionado)
                          // O si el seller_id coincide, O si el currentSeller coincide
                          selected:
                            selectedInvoiceType !== "normal"
                              ? false
                              : seller_id === el.id ||
                                currentSeller?.id === el.id,
                        };
                      }),
                    ]
              }
            />
          </>
        )}
      </SelectContainer>
    </FlexContainer>
  );
}
