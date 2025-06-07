export function time12HrsParser(customDate?: Date) {
  const date = customDate ? new Date(customDate) : new Date();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convierte de 24h a 12h
  hours = hours % 12;
  hours = hours ? hours : 12; // El 0 se convierte en 12

  const formattedTime = `${hours}:${minutes} ${ampm}`;
  return formattedTime;
}
