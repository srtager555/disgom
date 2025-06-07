export function numberParser(n: number, addMoneySign = false) {
  if (n === 0) {
    return "-";
  } else {
    const result = n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return addMoneySign ? `L ${result}` : result;
  }
}
