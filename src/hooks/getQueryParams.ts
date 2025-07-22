import { useEffect, useState } from "react";
import { useInvoiceIDManager } from "./offline/InvoiceIDManager";

function useQueryParams() {
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const { invoiceID } = useInvoiceIDManager();

  useEffect(() => {
    const result: Record<string, string> = {};
    if (global?.window && window.location.search) {
      const params = new URLSearchParams(window.location.search);

      params.forEach((value, key) => {
        result[key] = value;
      });

      setQueryParams(result);
    } else {
      if (invoiceID) {
        result["id"] = invoiceID;
      }
      setQueryParams(result);
    }

    console.log("invoice id manager", invoiceID);
    console.log("query results", result);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global?.window, global?.window?.location.search, invoiceID]);

  return queryParams;
}

export default useQueryParams;
