type InputEvent = React.ChangeEvent<HTMLInputElement>;

interface ParseOptions {
  min?: number;
  max?: number;
  returnRaw?: boolean;
}

export function parseNumberInput(
  setState: (val: number) => void,
  event: InputEvent,
  options?: ParseOptions
) {
  let raw: string | number = event.target.value;

  // Permitir borrar todo
  if (raw === "") {
    setState(0);
    return 0;
  }

  // Validar formato: solo dígitos con máximo un punto decimal
  if (!/^\d*\.?\d*$/.test(raw)) return;

  // Si empieza con ceros (como "0012" o "012.3"), limpiarlos
  if (raw.startsWith("0") && !raw.startsWith("0.") && raw.length > 1) {
    raw = String(Number(raw));
  }

  // Si hay límites, validar con ellos
  if (options?.min !== undefined || options?.max !== undefined) {
    const numericValue = parseFloat(raw);

    if (!isNaN(numericValue)) {
      if (options.max !== undefined && numericValue > options.max) {
        if (options?.returnRaw) {
          return Number(options.max);
        }
        setState(Number(options.max));
        return;
      }

      if (options.min !== undefined && numericValue < options.min) {
        if (options?.returnRaw) {
          return Number(options.min);
        }
        setState(Number(options.min));
        return;
      }
    }
  }

  if (options?.returnRaw) {
    return Number(raw);
  }

  setState(Number(raw));
}
