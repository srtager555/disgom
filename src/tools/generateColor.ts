export function getRandomColorContrastWhite() {
  while (true) {
    // Generar un color aleatorio
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Calcular la luminancia relativa
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    // Contraste con blanco (luminancia 1)
    const contrast = Math.abs(1 - luminance);

    // Verificar si cumple el contraste mínimo
    if (contrast >= 0.5) {
      return rgbToHex(r, g, b);
    }
  }
}

function rgbToHex(r: number, g: number, b: number) {
  // Convertir cada componente RGB a hexadecimal y asegurarse de que tenga 2 dígitos
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
