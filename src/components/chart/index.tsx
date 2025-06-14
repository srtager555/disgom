import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ChartData as ChartJSChartData,
  TooltipItem,
} from "chart.js";
import { isEqual } from "lodash";

ChartJS.register(
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

// Estructura de los datos de factura que se esperan como entrada
export type ChartData = Array<{ createdAt: Date; amount: number }>;

// Tipos para la estructura de datos interna de Chart.js
type ChartJSDatasetDataPoint = { x: string; y: number | null };

interface SalesChartDataset {
  label: string;
  data: ChartJSDatasetDataPoint[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointRadius: number;
  showLine: boolean;
  borderDash?: number[];
}

interface SalesChartJSData {
  labels: string[];
  datasets: SalesChartDataset[];
}

type props = {
  invoiceDataToChart?: ChartData; // Hacer opcional, ya que feed/index.tsx lo usa sin esta prop
  numberOfDaysToShow?: number; // Nueva prop para especificar el número de días
};

const SalesComparisonChart = ({
  invoiceDataToChart = [],
  numberOfDaysToShow = 7, // Valor por defecto de 7 días
}: props) => {
  const [chartData, setChartData] = useState<SalesChartJSData | null>(null);
  const last_dataToChat = useRef<ChartData>();

  useEffect(() => {
    const processChartData = () => {
      const today = new Date();
      const dayInMilliseconds = 24 * 60 * 60 * 1000;

      const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
          weekday: "short",
          day: "numeric",
          month: "short",
        };
        return date.toLocaleDateString("es-ES", options);
      };

      // Generar etiquetas para los últimos N días
      const lastNDaysLabels = Array.from(
        { length: numberOfDaysToShow },
        (_, i) => {
          const date = new Date(
            today.getTime() - (numberOfDaysToShow - 1 - i) * dayInMilliseconds
          );
          return formatDate(date);
        }
      );

      // --- Datos del Período Actual ---
      const startOfCurrentPeriod = new Date(
        today.getTime() - (numberOfDaysToShow - 1) * dayInMilliseconds
      );
      startOfCurrentPeriod.setHours(0, 0, 0, 0); // Normalizar al inicio del día

      const currentPeriodDataMap = invoiceDataToChart
        .filter((invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          invoiceDate.setHours(0, 0, 0, 0); // Normalizar para la comparación
          return invoiceDate >= startOfCurrentPeriod && invoiceDate <= today;
        })
        .reduce((acc, invoice) => {
          const formattedDate = formatDate(new Date(invoice.createdAt));
          acc[formattedDate] = (acc[formattedDate] || 0) + invoice.amount;
          return acc;
        }, {} as Record<string, number>);

      // --- Datos del Período Anterior ---
      const endOfPreviousPeriodBoundary = new Date(
        startOfCurrentPeriod.getTime()
      ); // Límite superior (exclusivo) para el período anterior
      const startOfPreviousPeriod = new Date(
        endOfPreviousPeriodBoundary.getTime() -
          numberOfDaysToShow * dayInMilliseconds
      );
      startOfPreviousPeriod.setHours(0, 0, 0, 0); // Normalizar

      const previousPeriodDataMap = invoiceDataToChart
        .filter((invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          invoiceDate.setHours(0, 0, 0, 0); // Normalizar
          return (
            invoiceDate >= startOfPreviousPeriod &&
            invoiceDate < endOfPreviousPeriodBoundary
          );
        })
        .reduce((acc, invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          // Proyectar esta fecha al día correspondiente en el rango de visualización actual
          const projectedDate = formatDate(
            new Date(
              invoiceDate.getTime() + numberOfDaysToShow * dayInMilliseconds
            )
          );
          acc[projectedDate] = (acc[projectedDate] || 0) + invoice.amount;
          return acc;
        }, {} as Record<string, number>);

      // Combinar los datos con valores nulos para fechas faltantes
      const createDataset = (dataMap: Record<string, number>, days: string[]) =>
        days.map((date) => ({
          x: date,
          y: dataMap[date] || null,
        }));

      const data = {
        labels: lastNDaysLabels,
        datasets: [
          {
            label: `Últimos ${numberOfDaysToShow} días`,
            data: createDataset(currentPeriodDataMap, lastNDaysLabels),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            pointRadius: 6,
            showLine: true,
          },
          {
            label: `${numberOfDaysToShow} días anteriores`,
            data: createDataset(previousPeriodDataMap, lastNDaysLabels),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 6,
            showLine: true,
          },
        ],
      };

      setChartData(data);
    };

    if (!isEqual(invoiceDataToChart, last_dataToChat.current)) {
      last_dataToChat.current = invoiceDataToChart;
      processChartData();
    }

    return;
  }, [invoiceDataToChart, numberOfDaysToShow]); // Añadir numberOfDaysToShow a las dependencias

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            const rawData = context.raw as ChartJSDatasetDataPoint;
            return `Fecha: ${rawData.x}, Ventas: ${
              rawData.y !== null ? rawData.y : "N/A"
            }`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Fechas",
        },
        type: "category",
      },
      y: {
        title: {
          display: true,
          text: "Ventas",
        },
      },
    },
  };

  return chartData ? (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Line data={chartData as ChartJSChartData} options={options} />
  ) : (
    <p>Cargando datos...</p>
  );
};

export default SalesComparisonChart;
