import { OfflineInvoiceIDMangerContext } from "@/components/layouts/OfflineInvoiceIDManager.layout";
import { useContext } from "react";

export function useInvoiceIDManager() {
  const id = useContext(OfflineInvoiceIDMangerContext);

  return id;
}
