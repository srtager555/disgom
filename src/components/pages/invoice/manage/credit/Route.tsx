import { Select } from "@/components/Inputs/select";
import { useInvoice } from "@/contexts/InvoiceContext";
import { FlexContainer } from "@/styles/index.styles";
import { updateDoc } from "firebase/firestore";
import { useMemo } from "react";

export function Route() {
  const { invoice } = useInvoice();
  const r = [
    { name: "Seleccionar", value: "0", disabled: true, selected: true },
    { name: "Ruta 1", value: "1" },
    { name: "Ruta 2", value: "2" },
    { name: "Ruta 3", value: "3" },
    { name: "Ruta 4", value: "4" },
    { name: "Ruta 5", value: "5" },
    { name: "Ruta 6", value: "6" },
  ];
  const routes = useMemo(() => {
    const router = invoice?.data()?.route;

    return r.map((r) => ({
      ...r,
      selected: Number(r.value) == router,
    }));
  }, [invoice]);

  const handlerUpdateRoute = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (!invoice) return;
    await updateDoc(invoice.ref, {
      route: Number(e.target.value),
    });
  };

  return (
    <FlexContainer
      styles={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2>
        ¿Que <b>Ruta</b> toca hoy?
      </h2>
      <Select name="route" options={routes} onChange={handlerUpdateRoute} />
    </FlexContainer>
  );
}
