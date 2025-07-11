import SalesComparisonChart, { ChartData } from "@/components/chart";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetEntries } from "@/hooks/products/getEntries";
import { useGetProductOutputs } from "@/hooks/products/getOutputs";
import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

const ProductMetricsContainer = styled(Container)`
  max-height: 70vh;
  overflow: auto;
`;

const OutputsEntriesContainer = styled(Container)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const DataParentContainer = styled(FlexContainer)`
  width: 100%;
  gap: 10px;
  padding: 10px;
  border: 1px solid ${globalCSSVars["--detail"]};
  flex-wrap: wrap;
`;

const DataContainer = styled(FlexContainer)`
  gap: 5px;
  flex-direction: column;
`;

export function ProductMetrics() {
  const { selectedProduct } = useContext(ProductContext);
  const outputs = useGetProductOutputs(selectedProduct?.ref);
  const entries = useGetEntries(selectedProduct?.ref);
  const [dataToChart, setDataToChart] = useState<ChartData>();

  useEffect(() => {
    if (outputs && outputs.length > 0) {
      const dailyTotals: Record<string, number> = {};

      outputs.forEach((output) => {
        const data = output.data();
        if (data?.created_at && typeof data.sale_value === "number") {
          const date = data.created_at.toDate();

          const onlyDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );

          console.log("fecha de raiz", onlyDate);
          try {
            const dateKey = onlyDate.toISOString().split("T")[0];
            dailyTotals[dateKey] =
              (dailyTotals[dateKey] || 0) + data.sale_value;
          } catch (error) {
            console.error(
              "Error al parsear la fecha:",
              data?.created_at,
              error
            );
            // Opcionalmente, manejar entradas con fechas inválidas
          }
        }
      });

      // Asumiendo que ChartData es Array<{ date: string, value: number }>
      const chartDataFormatted: ChartData = Object.entries(dailyTotals)
        .map(([date, totalSales]) => {
          // fix the issue about parse local time to UTC
          console.log("date", date);
          const localDate = new Date(date.replace(/-/g, "/"));

          console.log("localDate", localDate);
          return {
            createdAt: localDate,
            amount: totalSales,
          };
        })
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      console.log("metrics", chartDataFormatted);
      setDataToChart(chartDataFormatted as ChartData);
    } else {
      setDataToChart(undefined); // O un array vacío: [] si es más apropiado para SalesComparisonChart
    }
    console.log("????");
  }, [outputs]);

  return (
    <ProductMetricsContainer>
      <h2>Ventas y entras de los ultimos 14 dias</h2>
      <SalesComparisonChart invoiceDataToChart={dataToChart} />
      <FlexContainer styles={{ width: "100%", gap: "10px" }}>
        <OutputsEntriesContainer>
          <h3>Entradas</h3>
          {entries?.length === 0 && (
            <p>No hay entradas en los ultimos 14 dias</p>
          )}
          {entries?.map((entry, i) => {
            return <EntryElement key={i} entry={entry} />;
          })}
        </OutputsEntriesContainer>
        <OutputsEntriesContainer>
          <h3>Salidas</h3>
          {outputs?.map((output, i) => {
            return <OutputElement key={i} output={output} />;
          })}
        </OutputsEntriesContainer>
      </FlexContainer>
    </ProductMetricsContainer>
  );
}

function EntryElement({ entry }: { entry: QueryDocumentSnapshot<entryDoc> }) {
  const data = useMemo(() => entry.data(), [entry]);

  return (
    <DataParentContainer>
      <DataContainer>
        <span>Creación</span>
        <span>{data.created_at.toDate().toLocaleString()}</span>
      </DataContainer>
      <DataContainer>
        <span>Cantidad</span>
        <span>{data.amount}</span>
      </DataContainer>
      <DataContainer>
        <span>P. Costo</span>
        <span>
          {data.purchase_price} / {data.purchase_price * data.amount}
        </span>
      </DataContainer>
    </DataParentContainer>
  );
}

function OutputElement({
  output,
}: {
  output: QueryDocumentSnapshot<outputType>;
}) {
  const data = useMemo(() => output.data(), [output]);

  return (
    <DataParentContainer>
      <DataContainer styles={{ width: "100%" }}>
        <span>Creación</span>
        <span>{data.created_at.toDate().toLocaleString()}</span>
      </DataContainer>
      <DataContainer>
        <span>Cantidad</span>
        <span>{data.amount}</span>
      </DataContainer>
      <DataContainer>
        <span>P. Costo</span>
        <span>
          {data.purchase_price} / {data.purchase_price * data.amount}
        </span>
      </DataContainer>
    </DataParentContainer>
  );
}
