// /components/FirestoreSalesChart/chart.options.ts

import { TooltipItem } from "chart.js";

// Define las opciones de configuración para la gráfica de Chart.js.
export const getChartOptions = (currency: string = "USD") => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    tooltip: {
      callbacks: {
        // Personaliza el texto que se muestra en el tooltip al pasar el cursor sobre un punto.
        label: (context: TooltipItem<"line">) => {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            // Formatea el valor numérico como moneda.
            label += new Intl.NumberFormat("es-HN", {
              style: "currency",
              currency: currency,
            }).format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Fecha",
      },
      grid: {
        display: false, // Oculta la cuadrícula del eje X para un look más limpio.
      },
    },
    y: {
      title: {
        display: true,
        text: "Ventas",
      },
      // Agrega un padding superior al eje Y para que los puntos más altos no toquen el borde.
      grace: "10%",
    },
  },
});
