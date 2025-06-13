type InputEvent = React.ChangeEvent<HTMLInputElement>;

// Las opciones no cambian, los límites siguen siendo numéricos
interface ParseOptions {
  min?: number;
  max?: number;
  returnRaw?: boolean;
}

/**
 * Procesa el evento de un input para manejarlo como un string numérico.
 * Esta función está diseñada para trabajar con un estado de tipo `string`.
 */
export function parseNumberInput(
  // CAMBIO: setState ahora espera un string
  setState: (val: string) => void,
  event: InputEvent,
  options?: ParseOptions
  // CAMBIO: El tipo de retorno ahora es string o undefined
): string | undefined {
  const rawString: string = event.target.value;

  // Permitir borrar todo. Se guarda un string vacío.
  if (rawString === "") {
    setState("");
    if (options?.returnRaw) {
      return "";
    }
    return;
  }

  // Validar que el formato sea de un número decimal válido.
  // Esta expresión regular sigue siendo perfecta para el trabajo.
  if (!/^\d*\.?\d*$/.test(rawString)) {
    if (options?.returnRaw) {
      // Devolvemos el valor por defecto anterior, que es un string.
      return event.target.defaultValue;
    }
    return;
  }

  let processedString = rawString;

  // Limpiar ceros a la izquierda (ej: "007" -> "7") sin afectar "0."
  if (
    processedString.startsWith("0") &&
    !processedString.startsWith("0.") &&
    processedString.length > 1
  ) {
    processedString = String(Number(processedString));
  }

  // --- LÓGICA DE VALIDACIÓN DE LÍMITES (MIN/MAX) ---
  // Solo validamos los límites si el string no termina en ".",
  // para permitir que el usuario escriba números decimales sin ser
  // interrumpido. (Ej: Si max=100, permite escribir "12.3")
  if (!processedString.endsWith(".")) {
    const numericValue = parseFloat(processedString);

    // Nos aseguramos de que sea un número válido antes de comparar
    if (!isNaN(numericValue)) {
      if (options?.min !== undefined && numericValue < options.min) {
        // Si viola el mínimo, forzamos el estado al valor mínimo (como string)
        setState(String(options.min));
        if (options?.returnRaw) {
          return String(options.min);
        }
        return;
      }
      if (options?.max !== undefined && numericValue > options.max) {
        // Si viola el máximo, forzamos el estado al valor máximo (como string)
        setState(String(options.max));
        if (options?.returnRaw) {
          return String(options.max);
        }
        return;
      }
    }
  }

  // Si todas las validaciones pasan, actualizamos el estado con el string procesado
  setState(processedString);
  if (options?.returnRaw) {
    return processedString;
  }
}
