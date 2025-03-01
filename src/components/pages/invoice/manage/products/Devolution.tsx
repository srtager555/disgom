import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";

type props = {
  setDevolutionAmount: Dispatch<SetStateAction<number>>;
};

export function Devolution({ setDevolutionAmount }: props) {
  const [devo, setDevo] = useState(0);
  const devoDebounce = useDebounce(devo);

  // effect to set the debouce to the devo
  useEffect(() => {
    setDevolutionAmount(devoDebounce as number);
  }, [devoDebounce, setDevolutionAmount]);

  // I need add a effect to fecth the saved devolution

  return (
    <Column>
      <Input
        value={devo}
        onChange={(e) => {
          setDevo(Number(e.target.value));
        }}
        type="number"
      />
    </Column>
  );
}
