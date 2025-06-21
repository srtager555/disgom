import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { debounce } from "lodash";
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";

export interface UseManageDevolutionAmountReturn {
  currentServerDevolution: number;
  notifyIsWritting: () => void;
}

export function useManageDevolutionAmount(
  setDevoInput: Dispatch<SetStateAction<string>>,
  productDocId: string
): UseManageDevolutionAmountReturn {
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  const [devolutionHistory, setDevolutionHistory] = useState<number[]>([]);

  const { outputs: currentInventory } =
    useGetCurrentDevolutionByProduct(productDocId);

  const currentServerDevolution =
    currentInventory?.reduce((acc, next) => acc + next.data().amount, 0) || 0;

  const debouncedEndTyping = useCallback(
    debounce(() => {
      setIsUserTyping(false);
    }, 1500), // 1.5 seconds debounce time
    []
  );

  const notifyIsWritting = useCallback(() => {
    setIsUserTyping(true);
    debouncedEndTyping();
  }, [debouncedEndTyping]);

  useEffect(() => {
    if (!productDocId) {
      setDevoInput("0");
      setDevolutionHistory([]);
      return;
    }

    if (isUserTyping) {
      return;
    }

    if (!devolutionHistory.includes(currentServerDevolution)) {
      setDevoInput(String(currentServerDevolution));
      setDevolutionHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, currentServerDevolution];
        return updatedHistory.length > 10
          ? updatedHistory.slice(updatedHistory.length - 10)
          : updatedHistory;
      });
    }
  }, [currentServerDevolution, productDocId, isUserTyping, setDevoInput]);

  return {
    currentServerDevolution,
    notifyIsWritting,
  };
}
