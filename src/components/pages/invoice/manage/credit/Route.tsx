import { Select } from "@/components/Inputs/select";
import { useInvoice } from "@/contexts/InvoiceContext";
import { FlexContainer } from "@/styles/index.styles";
import { updateDoc } from "firebase/firestore";
import { useMemo } from "react";

export function Route() {
  const { invoice } = useInvoice();
  const routes = useMemo(() => {
    const router = invoice?.data()?.route;
    const r = [
      { name: "Seleccionar", value: "0", disabled: true },
      { name: "Ruta 1", value: "1" },
      { name: "Ruta 2", value: "2" },
      { name: "Ruta 3", value: "3" },
      { name: "Ruta 4", value: "4" },
      { name: "Ruta 5", value: "5" },
      { name: "Ruta 6", value: "6" },
    ];

    return r.map((r) => {
      return {
        ...r,
        selected: Number(r.value) == Number(router),
      };
    });
  }, [invoice]);

  const handlerUpdateRoute = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (!invoice) return;
    if (!e.target.value) return;

    const currentRouter = invoice.data().route;
    if (Number(currentRouter) == Number(e.target.value)) return;

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
