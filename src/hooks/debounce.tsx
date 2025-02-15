import { useEffect, useState } from "react";

export function useDebounce(value: string | number, timer: number = 500) {
  const [savedTimeout, setSavedTimeout] = useState<NodeJS.Timeout | undefined>(
    undefined
  );
  const [valueToReturn, setValueToReturn] = useState<string | number>();

  useEffect(() => {
    clearTimeout(savedTimeout);

    const timeoutToSave = setTimeout(() => setValueToReturn(value), timer);
    setSavedTimeout(timeoutToSave);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, value]);

  return valueToReturn;
}
