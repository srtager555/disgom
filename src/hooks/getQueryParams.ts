import { useMemo } from "react";

function useQueryParams() {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    const result: Record<string, string> = {};

    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  return queryParams;
}

export default useQueryParams;
