// /components/FirestoreSalesChart/helpers.ts

import {
  getDocs,
  query,
  where,
  Timestamp,
  Query,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import {
  sub,
  startOfDay,
  endOfDay,
  format,
  // differenceInMonths,
  add,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChartPeriod, SaleDataPoint, SalesStatistics } from "./types";

/**
 * Calcula los rangos de fechas (actual y anterior) basados en el período seleccionado.
 * @param period - El período seleccionado ('weekly', 'monthly', etc.).
 * @param customDates - Fechas personalizadas si el período es 'custom'.
 * @param compare - Booleano que indica si se debe calcular el período de comparación.
 * @returns Un objeto con las fechas de inicio y fin para el período actual y el anterior.
 */
export const getDateRanges = (
  period: ChartPeriod,
  customDates: { start: string; end: string },
  compare: boolean
) => {
  const today = endOfDay(new Date());
  let startDate: Date;
  let endDate: Date = today;

  // Determina el rango de fechas principal
  switch (period) {
    case "weekly":
      startDate = startOfDay(sub(today, { days: 6 }));
      break;
    case "monthly":
      startDate = startOfDay(sub(today, { months: 1 }));
      break;
    case "quarterly":
      startDate = startOfDay(sub(today, { months: 3 }));
      break;
    case "semi-annually":
      startDate = startOfDay(sub(today, { months: 6 }));
      break;
    case "annually":
      startDate = startOfDay(sub(today, { years: 1 }));
      break;
    case "custom":
      startDate = startOfDay(new Date(customDates.start));
      endDate = endOfDay(new Date(customDates.end));
      break;
    default:
      throw new Error("Período de tiempo no válido.");
  }

  // Si no hay comparación, las fechas anteriores son nulas.
  if (!compare) {
    return { current: { start: startDate, end: endDate }, previous: null };
  }

  // Calcula el rango de fechas para la comparación
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = sub(startDate, { days: 1 });
  const previousStartDate = new Date(previousEndDate.getTime() - duration);

  return {
    current: { start: startDate, end: endDate },
    previous: {
      start: startOfDay(previousStartDate),
      end: endOfDay(previousEndDate),
    },
  };
};

/**
 * Obtiene los documentos de Firestore dentro de un rango de fechas.
 * @param sourceQuery - La consulta o colección base de Firestore.
 * @param fieldToSum - El campo a sumar.
 * @param startDate - Fecha de inicio del rango.
 * @param endDate - Fecha de fin del rango.
 * @returns Una promesa que se resuelve en un array de puntos de datos.
 */
const fetchSalesData = async (
  sourceQuery: Query<DocumentData> | CollectionReference<DocumentData>,
  fieldToSum: string,
  startDate: Date,
  endDate: Date
): Promise<SaleDataPoint[]> => {
  // Construye la consulta de Firestore con el filtro de rango de fechas.

  console.log("Fechas delimitadoras");
  console.log(startDate, endDate);

  const timeQuery = query(
    sourceQuery,
    where("created_at", ">=", Timestamp.fromDate(startDate)),
    where("created_at", "<=", Timestamp.fromDate(endDate))
  );

  const querySnapshot = await getDocs(timeQuery);
  const data: SaleDataPoint[] = [];

  querySnapshot.forEach((doc) => {
    const docData = doc.data();
    // Asegura que la fecha y el monto existan y sean del tipo correcto.
    if (docData.created_at && typeof docData[fieldToSum] === "number") {
      data.push({
        date: docData.created_at.toDate(),
        amount: docData[fieldToSum],
      });
    }
  });

  return data;
};

/**
 * Orquesta la obtención de datos para el período actual y, opcionalmente, el anterior.
 */
export const fetchAllData = async (
  sourceQuery: Query<DocumentData> | CollectionReference<DocumentData>,
  fieldToSum: string,
  ranges: ReturnType<typeof getDateRanges>
) => {
  const { current, previous } = ranges;

  const currentPeriodPromise = fetchSalesData(
    sourceQuery,
    fieldToSum,
    current.start,
    current.end
  );
  const previousPeriodPromise = previous
    ? fetchSalesData(sourceQuery, fieldToSum, previous.start, previous.end)
    : Promise.resolve([]);

  const [currentPeriodData, previousPeriodData] = await Promise.all([
    currentPeriodPromise,
    previousPeriodPromise,
  ]);

  return { currentPeriodData, previousPeriodData };
};

/**
 * Agrupa los datos por día o por mes y suma los montos.
 * @param data - El array de puntos de datos.
 * @param formatString - El formato de fecha a usar como clave ('yyyy-MM-dd' para días, 'yyyy-MM' para meses).
 * @returns Un objeto Record donde las claves son fechas formateadas y los valores son los montos sumados.
 */
const aggregateData = (
  data: SaleDataPoint[],
  formatString: string
): Record<string, number> => {
  return data.reduce((acc, sale) => {
    const key = format(sale.date, formatString);
    acc[key] = (acc[key] || 0) + sale.amount;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Prepara los datos finales para ser renderizados por Chart.js.
 * @param currentData - Datos del período actual.
 * @param previousData - Datos del período anterior (puede estar vacío).
 * @param range - Rango de fechas del período actual.
 * @param groupByMonth - Booleano para agrupar por mes.
 * @returns Un objeto de datos compatible con Chart.js.
 */
export const prepareChartJsData = (
  currentData: SaleDataPoint[],
  previousData: SaleDataPoint[],
  range: { start: Date; end: Date },
  groupByMonth: boolean
) => {
  const formatKey = groupByMonth ? "yyyy-MM" : "yyyy-MM-dd";
  const formatLabel = groupByMonth ? "MMMM yyyy" : "eee, d MMM";
  const incrementUnit = groupByMonth ? { months: 1 } : { days: 1 };

  // Agrega los datos
  const aggregatedCurrent = aggregateData(currentData, formatKey);
  const aggregatedPrevious = aggregateData(previousData, formatKey);

  const labels: string[] = [];
  const currentDataset: (number | null)[] = [];
  const previousDataset: (number | null)[] = [];

  // Genera las etiquetas y los puntos de datos para el gráfico
  let currentDate = range.start;
  const duration = range.end.getTime() - range.start.getTime();

  while (currentDate <= range.end) {
    const key = format(currentDate, formatKey);
    const label = format(currentDate, formatLabel, { locale: es });

    // Evita duplicar etiquetas si se agrupa por mes
    if (!labels.includes(label)) {
      labels.push(label);
      currentDataset.push(aggregatedCurrent[key] || null);

      // Proyecta la fecha al período anterior para la comparación
      if (previousData.length > 0) {
        const previousDateKey = format(
          new Date(currentDate.getTime() - duration - 1000 * 60 * 60 * 24),
          formatKey
        );
        previousDataset.push(aggregatedPrevious[previousDateKey] || null);
      }
    }

    currentDate = add(currentDate, incrementUnit);
  }

  // Define los datasets para Chart.js
  const datasets = [
    {
      label: "Período Actual",
      data: currentDataset,
      borderColor: "rgba(75, 192, 192, 1)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      fill: true,
      tension: 0.3,
    },
  ];

  if (previousData.length > 0) {
    datasets.push({
      label: "Período Anterior",
      data: previousDataset,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderDash: [5, 5], // Línea punteada para comparación
      fill: true,
      tension: 0.3,
    });
  }

  return { labels, datasets };
};

/**
 * Calcula estadísticas de ventas como mediana, máximo, mínimo y crecimiento.
 * @param currentData - Datos del período actual.
 * @param previousData - Datos del período anterior.
 * @returns Un objeto con las estadísticas calculadas.
 */
export const calculateStatistics = (
  currentData: SaleDataPoint[],
  previousData: SaleDataPoint[]
): SalesStatistics => {
  const currentAmounts = currentData.map((d) => d.amount);
  const totalCurrentSales = currentAmounts.reduce(
    (sum, amount) => sum + amount,
    0
  );

  if (currentAmounts.length === 0) {
    return {
      median: 0,
      highestSale: 0,
      lowestSale: 0,
      growthPercentage: null,
      totalSales: 0,
    };
  }

  // Cálculo de estadísticas básicas
  const sortedAmounts = [...currentAmounts].sort((a, b) => a - b);
  const mid = Math.floor(sortedAmounts.length / 2);
  const median =
    sortedAmounts.length % 2 === 0
      ? (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2
      : sortedAmounts[mid];

  const highestSale = Math.max(...currentAmounts);
  const lowestSale = Math.min(...currentAmounts);

  // Cálculo del crecimiento porcentual
  let growthPercentage: number | null = null;
  if (previousData.length > 0) {
    const totalPreviousSales = previousData.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );
    if (totalPreviousSales > 0) {
      growthPercentage =
        ((totalCurrentSales - totalPreviousSales) / totalPreviousSales) * 100;
    } else if (totalCurrentSales > 0) {
      growthPercentage = 100; // Crecimiento infinito si el anterior fue 0.
    } else {
      growthPercentage = 0;
    }
  }

  return {
    median,
    highestSale,
    lowestSale,
    growthPercentage,
    totalSales: totalCurrentSales,
  };
};
