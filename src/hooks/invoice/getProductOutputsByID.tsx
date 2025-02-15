import { useEffect, useState } from "react";
import { useGetInvoiceByQueryOnSnapshot } from "./getInvoiceByQueryOnSnapshot";
import { outputType } from "@/tools/products/addOutputs";
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { isEqual } from "lodash";

export function useGetProductOutputByID(id: string) {
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const [output, setOutput] = useState<Array<DocumentSnapshot<outputType>>>([]);
  const [currentOutputs, setCurrentOutputs] = useState<
    Record<string, DocumentReference<outputType>[]>
  >({});

  // effect to check if the outputs are equal
  useEffect(() => {
    const data = invoice?.data();
    const newOutputs = data?.products_outputs || {};

    if (isEqual(currentOutputs, newOutputs)) return;

    setCurrentOutputs(newOutputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  // effect to get the outputs
  useEffect(() => {
    async function parseOutputs() {
      const outputsRef = currentOutputs[id] || [];

      const outputsPromises = outputsRef.map(async (ref) => await getDoc(ref));

      const outputsFetcheds = await Promise.all(outputsPromises);

      setOutput(outputsFetcheds);
    }

    parseOutputs();
  }, [currentOutputs, id]);

  return output;
}
