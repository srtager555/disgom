import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const SalesComparisonChart = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const invoices = [
        { createdAt: "2025-01-11", amount: 400 },
        { createdAt: "2025-01-12", amount: 750 },
        { createdAt: "2025-01-13", amount: 500 },
        { createdAt: "2025-01-14", amount: 600 },
        { createdAt: "2025-01-15", amount: 950 },
        { createdAt: "2025-01-16", amount: 700 },
        { createdAt: "2025-01-17", amount: 850 },
        { createdAt: "2025-01-04", amount: 500 },
        { createdAt: "2025-01-05", amount: 800 },
        { createdAt: "2025-01-06", amount: 450 },
        { createdAt: "2025-01-07", amount: 700 },
        { createdAt: "2025-01-08", amount: 1000 },
        { createdAt: "2025-01-09", amount: 650 },
        { createdAt: "2025-01-10", amount: 900 },
      ];

      const today = new Date("2025-01-17"); // Cambia a `new Date()` en producción

      // Crear un rango de los últimos 7 días con el día de la semana incluido
      const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
          weekday: "short", // Día de la semana (e.g., Lun)
          day: "numeric",
          month: "short", // Mes abreviado (e.g., Ene)
        };
        return date.toLocaleDateString("es-ES", options);
      };

      const last7Days = Array.from({ length: 7 }, (_, i) =>
        formatDate(new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000))
      );

      // Crear un mapeo para las ventas de la semana actual
      const currentWeekData = invoices
        .filter(
          (invoice) =>
            new Date(invoice.createdAt) >=
            new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
        )
        .reduce((acc, invoice) => {
          acc[formatDate(new Date(invoice.createdAt))] = invoice.amount;
          return acc;
        }, {} as Record<string, number>);

      // Crear un mapeo para las ventas de la semana anterior, proyectando al mismo día de la semana
      const previousWeekData = invoices
        .filter(
          (invoice) =>
            new Date(invoice.createdAt) <
            new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
        )
        .reduce((acc, invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          const projectedDate = formatDate(
            new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Proyectar al día correspondiente de la semana actual
          );
          acc[projectedDate] = invoice.amount;
          return acc;
        }, {} as Record<string, number>);

      // Combinar los datos con valores nulos para fechas faltantes
      const createDataset = (dataMap: Record<string, number>, days: string[]) =>
        days.map((date) => ({
          x: date,
          y: dataMap[date] || null, // Usar null si no hay datos para la fecha
        }));

      const data = {
        labels: last7Days, // Solo los últimos 7 días con día de la semana
        datasets: [
          {
            label: "Semana Actual",
            data: createDataset(currentWeekData, last7Days),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            pointRadius: 6,
            showLine: true,
          },
          {
            label: "Semana Anterior",
            data: createDataset(previousWeekData, last7Days),
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

    fetchInvoices();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Fecha: ${context.raw.x}, Ventas: ${context.raw.y}`;
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
    <Line data={chartData} options={options} />
  ) : (
    <p>Cargando datos...</p>
  );
};

export default SalesComparisonChart;
