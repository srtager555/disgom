// src/hooks/invoice/useManageServerAmount.ts
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { DocumentSnapshot } from "firebase/firestore";
import { isEqual, debounce } from "lodash";
import { outputType } from "@/tools/products/addOutputs";
import { useProductOutputs } from "@/contexts/ProductOutputsContext";

export interface UseManageServerAmountReturn {
  currentServerAmount: number;
  notifyIsWritting: () => void;
  rawOutputsFromServer: DocumentSnapshot<outputType>[];
}

export function useManageServerAmount(
  setAmountInput: Dispatch<SetStateAction<string>>,
  productDocId: string | undefined
): UseManageServerAmountReturn {
  const [currentServerAmount, setCurrentServerAmount] = useState<number>(0);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  const [outputsHistory, setOutputsHistory] = useState<outputType[][]>([]);
  const [processedOutputsForComponent, setProcessedOutputsForComponent] =
    useState<DocumentSnapshot<outputType>[]>([]);

  // Suponiendo que useProductOutputs es un hook existente que devuelve los outputs del producto.
  // Si no existe, necesitarás implementarlo o ajustarlo según tu estructura.
  const { outputs: contextualOutputs } = useProductOutputs();

  const debouncedEndTyping = useCallback(
    debounce(() => {
      setIsUserTyping(false);
    }, 1500), // Increased debounce time to 1.5 seconds
    []
  );

  const notifyIsWritting = useCallback(() => {
    setIsUserTyping(true);
    debouncedEndTyping();
  }, [debouncedEndTyping]);

  useEffect(() => {
    // Si no hay productDocId o contextualOutputs, reseteamos.
    if (!productDocId || !contextualOutputs) {
      setCurrentServerAmount(0);
      setAmountInput("0");
      setProcessedOutputsForComponent([]);
      setOutputsHistory([]);
      return;
    }

    if (isUserTyping) {
      // console.log("useManageServerAmount: User is typing, skipping update from server outputs.");
      return;
    }

    const currentOutputDataArray = contextualOutputs.map(
      (doc) => doc.data() as outputType
    );

    const isAlreadyInHistory = outputsHistory.some((historyEntry) =>
      isEqual(historyEntry, currentOutputDataArray)
    );

    if (!isAlreadyInHistory) {
      // console.log("useManageServerAmount: New server outputs detected, not in history. Updating states.");
      const newCalculatedAmount = contextualOutputs.reduce(
        (acc, doc) => acc + (doc.data()?.amount || 0),
        0
      );

      setCurrentServerAmount(newCalculatedAmount);
      setAmountInput(String(newCalculatedAmount));
      setProcessedOutputsForComponent(contextualOutputs);

      setOutputsHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, currentOutputDataArray];
        // Mantener solo los últimos 10 historiales
        return updatedHistory.length > 10
          ? updatedHistory.slice(updatedHistory.length - 10)
          : updatedHistory;
      });
    } else {
      // console.log("useManageServerAmount: Server outputs are already in history or user is typing. No update.");
    }
  }, [contextualOutputs, isUserTyping, setAmountInput]); // outputsHistory no es necesario aquí para evitar bucles

  return {
    currentServerAmount,
    notifyIsWritting,
    rawOutputsFromServer: processedOutputsForComponent,
  };
}
