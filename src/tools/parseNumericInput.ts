type InputEvent = React.ChangeEvent<HTMLInputElement>;

interface ParseOptions {
  min?: number;
  max?: number;
  returnRaw?: boolean;
}

export function parseNumberInput(
  setState: (val: string) => void,
  event: InputEvent,
  options?: ParseOptions
): number | undefined {
  const rawString: string = event.target.value;
  console.log("input value: ", rawString);

  // Permitir borrar todo
  if (rawString === "") {
    setState(0);
    if (options?.returnRaw) {
      return 0;
    }
    return;
  }

  // Validar formato: solo dígitos con máximo un punto decimal
  if (!/^\d*\.?\d*$/.test(rawString)) {
    if (options?.returnRaw) {
      const defaultValue = parseFloat(event.target.defaultValue);
      return !isNaN(defaultValue) ? defaultValue : NaN;
    }
    return;
  }

  let processedString = rawString;
  // Si empieza con ceros (como "0012" o "012.3"), limpiarlos
  if (
    processedString.startsWith("0") &&
    !processedString.startsWith("0.") &&
    processedString.length > 1
  ) {
    processedString = String(Number(processedString));
  }

  // Si la cadena termina con un punto (ej: "." o "123."), es una entrada
  // incompleta. No llamamos a setState para permitir que el campo de texto
  // muestre la entrada actual y el usuario pueda seguir escribiendo.
  if (processedString.endsWith(".")) {
    console.log("final with .");
    if (options?.returnRaw) {
      // Para returnRaw, devolvemos la parte entera o NaN si solo es "."
      const val = parseFloat(processedString);
      return isNaN(val) ? NaN : val;
    }
    return setState(rawString); // No actualizamos el estado numérico todavía.
  }

  const numericValue = parseFloat(processedString);

  // Si parseFloat resulta en NaN (y no fue solo "."), es una entrada inválida.
  if (isNaN(numericValue)) {
    if (options?.returnRaw) {
      return NaN;
    }
    return; // No actualizamos el estado con NaN.
  }

  // Si hay límites, validar con ellos
  if (options?.min !== undefined && numericValue < options.min) {
    setState(options.min);
    if (options?.returnRaw) {
      return options.min;
    }
    return;
  }
  if (options?.max !== undefined && numericValue > options.max) {
    setState(options.max);
    if (options?.returnRaw) {
      return options.max;
    }
    return;
  }

  setState(numericValue);
  if (options?.returnRaw) {
    return numericValue;
  }
}
