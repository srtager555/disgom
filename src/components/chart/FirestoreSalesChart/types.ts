// /components/FirestoreSalesChart/types.ts

import { CollectionReference, DocumentData, Query } from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";

// Define los posibles períodos de tiempo que el usuario puede seleccionar.
export type ChartPeriod =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi-annually"
  | "annually"
  | "custom";

// Estructura de un único punto de dato extraído de Firestore.
export interface SaleDataPoint {
  date: Date;
  amount: number;
}

// Estructura de los datos procesados que se pueden pasar al componente padre.
export interface ProcessedData {
  byMonths: Record<string, number>;
  byDays: Record<string, number>;
  allDataFetched: SaleDataPoint[];
}

// Estructura para los datos de resumen (mediana, máximo, etc.).
export interface SalesStatistics {
  median: number;
  highestSale: number;
  lowestSale: number;
  growthPercentage: number | null; // Nulo si la comparación no está activa.
  totalSales: number;
}

// Props del componente principal FirestoreSalesChart.
export interface FirestoreSalesChartProps {
  // Query o referencia a la colección de Firestore.
  queryOrCollection: Query<DocumentData> | CollectionReference<DocumentData>;
  // Campo del documento que contiene el valor numérico a sumar.
  fieldToSum?: string;
  // (Opcional) Setter de estado para devolver los datos procesados al componente padre.
  setDataUsed?: Dispatch<SetStateAction<ProcessedData | null>>;
}
