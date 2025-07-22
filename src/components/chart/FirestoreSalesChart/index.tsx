// /components/FirestoreSalesChart/index.tsx

import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
} from "chart.js";
import { differenceInMonths } from "date-fns";

import {
  FirestoreSalesChartProps,
  ChartPeriod,
  SalesStatistics,
} from "./types";
import {
  getDateRanges,
  fetchAllData,
  prepareChartJsData,
  calculateStatistics,
} from "./helpers";
import { getChartOptions } from "./chart.options";

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FirestoreSalesChart: React.FC<FirestoreSalesChartProps> = ({
  queryOrCollection,
  fieldToSum = "amount", // Valor por defecto para el campo a sumar
  setDataUsed,
}) => {
  // --- ESTADOS DEL COMPONENTE ---
  const [period, setPeriod] = useState<ChartPeriod>("weekly");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [compare, setCompare] = useState(false);

  const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);
  const [stats, setStats] = useState<SalesStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Manejador principal que se activa al hacer clic en el botón de búsqueda.
   * Orquesta todo el proceso de obtención y visualización de datos.
   */
  const handleSearch = async (e) => {
    e.preventDefault();

    // Validar fechas personalizadas si es necesario
    if (period === "custom" && (!customDates.start || !customDates.end)) {
      setError("Por favor, selecciona una fecha de inicio y fin.");
      return;
    }

    setLoading(true);
    setError(null);
    setChartData(null);
    setStats(null);

    try {
      // 1. Calcular los rangos de fechas
      const ranges = getDateRanges(period, customDates, compare);

      // 2. Determinar cómo agrupar los datos (por día o mes)
      const diff = differenceInMonths(ranges.current.end, ranges.current.start);
      const groupByMonth =
        period !== "weekly" &&
        period !== "monthly" &&
        (period !== "custom" || diff >= 3);

      // 3. Obtener los datos desde Firestore
      const { currentPeriodData, previousPeriodData } = await fetchAllData(
        queryOrCollection,
        fieldToSum,
        ranges
      );

      // 4. (Opcional) Devolver los datos crudos al componente padre
      if (setDataUsed) {
        setDataUsed({
          byDays: {}, // Puedes implementar la lógica de llenado si es necesario
          byMonths: {}, // Puedes implementar la lógica de llenado si es necesario
          allDataFetched: [...currentPeriodData, ...previousPeriodData],
        });
      }

      // 5. Preparar los datos para la gráfica
      const formattedChartData = prepareChartJsData(
        currentPeriodData,
        previousPeriodData,
        ranges.current,
        groupByMonth
      );
      setChartData(formattedChartData);

      // 6. Calcular y mostrar las estadísticas
      const calculatedStats = calculateStatistics(
        currentPeriodData,
        previousPeriodData
      );
      setStats(calculatedStats);
    } catch (e) {
      console.error("Error al procesar los datos de ventas:", e);
      setError("No se pudieron cargar los datos. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "1rem",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
      }}
    >
      {/* --- PANEL DE CONTROLES --- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as ChartPeriod)}
        >
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="quarterly">Trimestral</option>
          <option value="semi-annually">Medio Año</option>
          <option value="annually">Anual</option>
          <option value="custom">Personalizado</option>
        </select>

        {period === "custom" && (
          <>
            <input
              type="date"
              value={customDates.start}
              onChange={(e) =>
                setCustomDates((p) => ({ ...p, start: e.target.value }))
              }
            />
            <input
              type="date"
              value={customDates.end}
              onChange={(e) =>
                setCustomDates((p) => ({ ...p, end: e.target.value }))
              }
            />
          </>
        )}

        <label>
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />
          Comparar con período anterior
        </label>

        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Cargando..." : "Buscar Resultados"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* --- TARJETAS DE ESTADÍSTICAS --- */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <h4>Ventas Totales</h4>
            <p>
              {new Intl.NumberFormat("es-HN", {
                style: "currency",
                currency: "HNL",
              }).format(stats.totalSales)}
            </p>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <h4>Venta Mediana</h4>
            <p>
              {new Intl.NumberFormat("es-HN", {
                style: "currency",
                currency: "HNL",
              }).format(stats.median)}
            </p>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <h4>Mayor Venta</h4>
            <p>
              {new Intl.NumberFormat("es-HN", {
                style: "currency",
                currency: "HNL",
              }).format(stats.highestSale)}
            </p>
          </div>
          {stats.growthPercentage !== null && (
            <div
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                borderRadius: "4px",
                color: stats.growthPercentage >= 0 ? "green" : "red",
              }}
            >
              <h4>Crecimiento</h4>
              <p>{stats.growthPercentage.toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      {/* --- GRÁFICA --- */}
      <div style={{ position: "relative", height: "400px" }}>
        {chartData ? (
          <Line data={chartData} options={getChartOptions("HNL")} />
        ) : (
          !loading && (
            <p>
              Selecciona un período y haz clic en &quot;Buscar Resultados&quot;
              para ver la gráfica.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export { FirestoreSalesChart };
