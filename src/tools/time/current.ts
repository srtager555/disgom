interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calcula el rango de fechas (inicio y fin) para la semana actual.
 * La semana se considera que empieza en Lunes y termina en Domingo.
 *
 * @returns Un objeto con las propiedades 'start' y 'end' (Date objects).
 */
export function getCurrentWeekRange(date: Date = new Date()): DateRange {
  const now = new Date(date);
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Calculamos cuántos días hay que restar para llegar al Lunes
  // Si hoy es Domingo (0), restamos 6 días. Si es Lunes (1), restamos 0. Si es Martes (2), restamos 1, etc.
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Creamos una nueva fecha para el inicio de la semana
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - diffToMonday);
  startDate.setHours(0, 0, 0, 0); // Establecemos la hora al inicio del día

  // Creamos una nueva fecha para el fin de la semana (6 días después del inicio)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999); // Establecemos la hora al final del día

  return { start: startDate, end: endDate };
}

/**
 * Calcula el rango de fechas (inicio y fin) para el mes actual.
 *
 * @returns Un objeto con las propiedades 'start' y 'end' (Date objects).
 */
export function getCurrentMonthRange(date: Date = new Date()): DateRange {
  const now = new Date(date);
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Enero, 1 = Febrero, ..., 11 = Diciembre

  // El primer día del mes
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);

  // El último día del mes.
  // Creamos una fecha para el primer día del *siguiente* mes y le restamos un día.
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  // El día '0' del mes siguiente corresponde al último día del mes actual.

  return { start: startDate, end: endDate };
}

// --- Ejemplo de uso ---
const weekRange = getCurrentWeekRange();
console.log("Inicio de la semana:", weekRange.start.toLocaleDateString());
console.log("Fin de la semana:", weekRange.end.toLocaleDateString());

const monthRange = getCurrentMonthRange();
console.log("Inicio del mes:", monthRange.start.toLocaleDateString());
console.log("Fin del mes:", monthRange.end.toLocaleDateString());

// Ejemplo con formato más completo
console.log("\n--- Rango Semanal Detallado ---");
console.log("Inicio:", weekRange.start.toISOString());
console.log("Fin:", weekRange.end.toISOString());

console.log("\n--- Rango Mensual Detallado ---");
console.log("Inicio:", monthRange.start.toISOString());
console.log("Fin:", monthRange.end.toISOString());
