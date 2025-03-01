export function getQueryParams() {
  const result: Record<string, string> = {};

  if (global?.window && window.location.search) {
    const params = new URLSearchParams(window.location.search);

    params.forEach((value, key) => {
      result[key] = value;
    });
  }

  return result;
}
