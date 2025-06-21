import { createContext, useContext, ReactNode } from "react";
import { DocumentSnapshot } from "firebase/firestore";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";

// Define el tipo para el valor del contexto
type ProductOutputsContextType = {
  outputs: DocumentSnapshot<outputType>[];
};

// Crea el contexto
const ProductOutputsContext = createContext<
  ProductOutputsContextType | undefined
>(undefined);

// Componente Proveedor del Contexto
type ProductOutputsProviderProps = {
  children: ReactNode;
  productDocId: string; // Necesitamos el ID del producto para el hook
};

export function ProductOutputsProvider({
  children,
  productDocId,
}: ProductOutputsProviderProps) {
  // Usa el hook para obtener los outputs del producto
  const outputs = useGetProductOutputByID(productDocId);

  // Provee los outputs a través del contexto
  return (
    <ProductOutputsContext.Provider value={{ outputs }}>
      {children}
    </ProductOutputsContext.Provider>
  );
}

// Hook Consumidor del Contexto
export function useProductOutputs() {
  const context = useContext(ProductOutputsContext);
  if (context === undefined) {
    throw new Error(
      "useProductOutputs debe ser usado dentro de un ProductOutputsProvider"
    );
  }
  return context;
}
