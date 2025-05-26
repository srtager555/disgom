type InputEvent = React.ChangeEvent<HTMLInputElement>;

interface ParseOptions {
  min?: number;
  max?: number;
}

export function parseNumberInput(
  setState: (val: string) => void,
  event: InputEvent,
  options?: ParseOptions
) {
  let raw = event.target.value;

  // Permitir borrar todo
  if (raw === "") {
    setState("");
    return;
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
        setState(String(options.max));
        return;
      }

      if (options.min !== undefined && numericValue < options.min) {
        setState(String(options.min));
        return;
      }
    }
  }

  setState(raw);
}
