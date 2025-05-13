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
 * Calcula el rango de fechas (inicio y fin) para un periodo de dos semanas a partir de la semana actual.
 * La primera semana se considera que empieza en Lunes y la segunda semana termina el Domingo siguiente.
 *
 * @param date - La fecha a partir de la cual calcular el rango. Por defecto, la fecha actual.
 * @returns Un objeto con las propiedades 'start' y 'end' (Date objects).
 */
export function getCurrentTwoWeekRange(date: Date = new Date()): DateRange {
  const now = new Date(date);
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Calculamos cuántos días hay que restar para llegar al Lunes de la semana actual
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Creamos una nueva fecha para el inicio del rango de dos semanas (Lunes de la semana actual)
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - diffToMonday);
  startDate.setHours(0, 0, 0, 0); // Establecemos la hora al inicio del día

  // Creamos una nueva fecha para el fin del rango de dos semanas (Domingo de la semana siguiente)
  // Son 13 días después del inicio (0-6 para la primera semana, 7-13 para la segunda)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13);
  endDate.setHours(23, 59, 59, 999); // Establecemos la hora al final del día

  return { start: startDate, end: endDate };
}

/**
 * Calcula el rango de fechas (inicio y fin) para un período de N meses.
 * El rango comienza el primer día del mes *anterior* al mes de la fecha 'inputDate'
 * y se extiende por 'numberOfMonths'.
 * Por ejemplo, si inputDate es Julio y numberOfMonths es 1, devuelve el rango de Junio.
 * Si inputDate es Julio y numberOfMonths es 2, devuelve el rango de Junio y Julio.
 *
 * @param inputDate - La fecha base para el cálculo. El rango comenzará un mes antes de esta fecha. Por defecto, la fecha actual.
 * @param numberOfMonths - El número de meses que debe abarcar el rango. Por defecto, 1.
 * @returns Un objeto con las propiedades 'start' y 'end' (Date objects).
 */
export function getCurrentMonthRange(
  inputDate: Date = new Date(),
  numberOfMonths: number = 1
): DateRange {
  if (numberOfMonths < 1) {
    throw new Error("El número de meses debe ser al menos 1.");
  }

  // Creamos una copia de inputDate para no modificar el original
  const dateForCalculation = new Date(inputDate);

  // Retrocedemos un mes para establecer la base del cálculo
  dateForCalculation.setMonth(dateForCalculation.getMonth() - 1);

  const year = dateForCalculation.getFullYear();
  const month = dateForCalculation.getMonth(); // Este es el mes anterior al de inputDate

  // El primer día del mes base (que es un mes antes del mes de inputDate)
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);

  // El último día del mes final del rango.
  // El rango tiene una duración de 'numberOfMonths' comenzando desde 'month'.
  // El mes final es 'month + numberOfMonths - 1'.
  // Para obtener el último día de ese mes, usamos 'month + numberOfMonths' como mes y día 0.
  const endDate = new Date(year, month + numberOfMonths, 0, 23, 59, 59, 999);

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
