import { useEffect, useState } from "react";

function useQueryParams() {
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (global?.window && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const result: Record<string, string> = {};

      params.forEach((value, key) => {
        result[key] = value;
      });

      setQueryParams(result);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global?.window, global?.window?.location.search]);

  return queryParams;
}

export default useQueryParams;
