import { createContext, useState } from "react";

export const OfflineInvoiceIDMangerContext = createContext<{
  invoiceID: string;
  setInvoiceID: (id: string) => void;
  openTheNewestInvoice: boolean;
  setOpenTheNewestInvoice: (open: boolean) => void;
}>({
  invoiceID: "",
  setInvoiceID: () => {},
  openTheNewestInvoice: false,
  setOpenTheNewestInvoice: () => {},
});

export function OfflineInvoiceIDManager({ children }: { children: children }) {
  const [invoiceID, setInvoiceID] = useState("");
  const [openTheNewestInvoice, setOpenTheNewestInvoice] = useState(false);

  return (
    <OfflineInvoiceIDMangerContext.Provider
      value={{
        invoiceID,
        setInvoiceID,
        openTheNewestInvoice,
        setOpenTheNewestInvoice,
      }}
    >
      {children}
    </OfflineInvoiceIDMangerContext.Provider>
  );
}
