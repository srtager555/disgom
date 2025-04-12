import {
  Dispatch,
  memo,
  RefObject,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { rawOutput } from "./AddOutput";
import { SellersDoc } from "@/tools/sellers/create";
import { isEqual } from "lodash";
import { useInvoice } from "@/contexts/InvoiceContext";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { someHumanChangesDetected } from "./Product";
import { saveDevolution } from "@/tools/products/saveDevolution";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";

type devolutionBase = {
  outputs: DocumentSnapshot<outputType>[];
  productDoc: DocumentSnapshot<productDoc>;
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;
  inventory: DocumentSnapshot<inventory_output>[];
  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  sellerHasInventory: boolean | undefined;
  currentServerDevolution: number;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
};

export const Devolution = (
  props: Omit<
    devolutionBase,
    "currentServerDevolution" | "outputs" | "invoiceDoc"
  >
) => {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const { invoice: invoiceDoc } = useInvoice();
  const currentServerDevolution = useMemo(
    () =>
      currentInventory.outputs?.reduce(
        (acc, next) => acc + next.data().amount,
        0
      ) || 0,
    [currentInventory]
  );

  return (
    <DevolutionMemo
      {...props}
      outputs={outputs}
      invoiceDoc={invoiceDoc}
      currentServerDevolution={currentServerDevolution}
    />
  );
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.currentServerDevolution !== next.currentServerDevolution)
    return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (!isEqual(prev.invoiceDoc, next.invoiceDoc)) return false;
  if (!isEqual(prev.customPrice, next.customPrice)) return false;
  if (!isEqual(prev.seletedSeller, next.seletedSeller)) return false;
  if (!isEqual(prev.sellerHasInventory, next.sellerHasInventory)) return false;
  if (!isEqual(prev.currentServerDevolution, next.currentServerDevolution))
    return false;
  if (!isEqual(prev.inventory, next.inventory)) return false;
  return true;
});

function DevolutionBase({
  outputs,
  productDoc,
  invoiceDoc,
  inventory: inventory_outputs,
  customPrice,
  setRemainStock,
  seletedSeller,
  sellerHasInventory,
  currentServerDevolution,
  someHumanChangesDetected,
}: devolutionBase) {
  const [devo, setDevo] = useState(0);
  const [lastHasInventory, setLastHasInventory] = useState<boolean | undefined>(
    sellerHasInventory
  );
  const [itsSaving, setItsSaving] = useState(false);
  const [localCurrentDevo, setLocalCurrentDevo] = useState(
    currentServerDevolution
  );
  const [localCurrentDevoHistory, setLocalCurrentDevoHistory] = useState<
    number[]
  >([]);
  const lastDevo = useRef<number | null>(null);
  const lastCustomPrice = useRef(customPrice);
  const humanAmountChanged = useRef(false);
  const devoDebounce = useDebounce(devo);

  // effect to save the current devo
  useEffect(() => {
    if (!localCurrentDevoHistory.includes(currentServerDevolution)) {
      setLocalCurrentDevo(currentServerDevolution);
    }
  }, [currentServerDevolution]);

  useEffect(() => {
    if (devoDebounce != currentServerDevolution)
      setDevo(currentServerDevolution);
    console.log(
      "current devo and devo debounce",
      currentServerDevolution,
      devoDebounce
    );
  }, [currentServerDevolution]);

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice === lastCustomPrice.current) return;
    humanAmountChanged.current = true;
    lastCustomPrice.current = customPrice;
    console.log("price changed in devolution", customPrice);
  }, [customPrice, lastCustomPrice]);

  // effect to detect if the seller havent inventory
  useEffect(() => {
    if (sellerHasInventory !== lastHasInventory) {
      someHumanChangesDetected.current.devolution = true;
      setLastHasInventory(sellerHasInventory);
    }
  }, [sellerHasInventory]);

  // effect to save the devolution
  useEffect(() => {
    if (!invoiceDoc) return;
    if (!productDoc) return;
    if (!seletedSeller) return;

    // if the devo is being saved, save the devo to the lastDevo
    let devoToWork = devoDebounce as number;
    if (itsSaving) {
      console.log("devo is being saved, saving to lastDevo");
      lastDevo.current = devoToWork as number;
      return;
    } else if (lastDevo.current) {
      console.log("devo is not being saved, getting devo from lastDevo");
      devoToWork = lastDevo.current as number;
      lastDevo.current = null;
    }
    setItsSaving(true);

    saveDevolution(
      invoiceDoc,
      productDoc,
      seletedSeller,
      inventory_outputs,
      outputs,
      devoToWork,
      customPrice,
      setRemainStock,
      humanAmountChanged,
      localCurrentDevo
    );

    setLocalCurrentDevoHistory([...localCurrentDevoHistory, localCurrentDevo]);
    setLocalCurrentDevo(devoToWork);
    setItsSaving(false);
  }, [
    customPrice,
    seletedSeller,
    devoDebounce,
    outputs,
    itsSaving,
    inventory_outputs,
  ]);

  if (sellerHasInventory) {
    return (
      <Column>
        <Input
          value={devo}
          onChange={(e) => {
            setDevo(Number(e.target.value));
            console.log("devo changed", e.target.value);
            humanAmountChanged.current = true;
            someHumanChangesDetected.current.devolution = true;
          }}
          type="number"
        />
      </Column>
    );
  }
}
