import { useEffect, useState } from "react";

function useQueryParams() {
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    setQueryParams(result);
  }, []);

  return queryParams;
}

export default useQueryParams;
