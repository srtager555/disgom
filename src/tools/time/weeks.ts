export function oneWeekAfter(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setDate(startDate.getDate() + 7);
  return newDate;
}

export function oneWeekBefore(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setDate(startDate.getDate() - 7);
  return newDate;
}

export function fifteenDaysAfter(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setDate(startDate.getDate() + 15);
  return newDate;
}

export function fifteenDaysBefore(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setDate(startDate.getDate() - 15);
  return newDate;
}

export function oneMonthAfter(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() + 1);
  return newDate;
}

export function oneMonthBefore(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() - 1);
  return newDate;
}

export function twoMonthsAfter(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() + 2);
  return newDate;
}

export function twoMonthsBefore(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() - 2);
  return newDate;
}

export function sixMonthsAfter(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() + 6);
  return newDate;
}

export function sixMonthsBefore(startDate: Date = new Date()): Date {
  const newDate = new Date(startDate);
  newDate.setMonth(startDate.getMonth() - 6);
  return newDate;
}
