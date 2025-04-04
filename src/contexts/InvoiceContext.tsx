import { createContext, useContext, ReactNode } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";

type InvoiceContextType = {
  invoice: QueryDocumentSnapshot<invoiceType> | undefined;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const invoice = useGetInvoiceByQueryOnSnapshot();

  return (
    <InvoiceContext.Provider value={{ invoice }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoice debe ser usado dentro de un InvoiceProvider");
  }
  return context;
}
