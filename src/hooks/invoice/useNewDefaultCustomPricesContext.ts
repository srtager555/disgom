import { NewDefaultCustomPrices } from "@/pages/invoices/manage";
import { useContext } from "react";

export function useNewDefaultCustomPricesContext() {
  const context = useContext(NewDefaultCustomPrices);

  if (context === undefined) {
    throw new Error(
      "useNewDefaultCustomPricesContext must be used within a NewDefaultCustomPricesProvider"
    );
  }

  return context;
}
