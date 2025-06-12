import SalesComparisonChart, { ChartData } from "@/components/chart";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetEntries } from "@/hooks/products/getEntries";
import { useGetProductOutputs } from "@/hooks/products/getOutputs";
import { Container } from "@/styles/index.styles";
import { useContext, useEffect, useState } from "react";
import styled from "styled-components";

const ProductMetricsContainer = styled(Container)`
  max-height: 70vh;
  overflow: auto;
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
          try {
            const dateKey = new Date(data?.created_at.toDate())
              .toISOString()
              .split("T")[0];
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
        .map(([date, totalSales]) => ({
          createdAt: new Date(date),
          amount: totalSales,
        }))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
    </ProductMetricsContainer>
  );
}
