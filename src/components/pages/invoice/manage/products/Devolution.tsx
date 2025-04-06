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

type devolutionBase = {
  outputs: DocumentSnapshot<outputType>[];
  productDoc: DocumentSnapshot<productDoc>;
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;

  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  sellerHasInventory: boolean | undefined;
  currentDevolution: number;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
};

export const Devolution = (
  props: Omit<devolutionBase, "currentDevolution" | "outputs" | "invoiceDoc">
) => {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const { invoice: invoiceDoc } = useInvoice();
  const currentDevolution = useMemo(
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
      currentDevolution={currentDevolution}
    />
  );
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.currentDevolution !== next.currentDevolution) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (!isEqual(prev.invoiceDoc, next.invoiceDoc)) return false;
  if (!isEqual(prev.customPrice, next.customPrice)) return false;
  if (!isEqual(prev.seletedSeller, next.seletedSeller)) return false;
  if (!isEqual(prev.sellerHasInventory, next.sellerHasInventory)) return false;
  if (!isEqual(prev.currentDevolution, next.currentDevolution)) return false;

  return true;
});

function DevolutionBase({
  outputs,
  productDoc,
  invoiceDoc,
  customPrice,
  setRemainStock,
  seletedSeller,
  sellerHasInventory,
  currentDevolution,
  someHumanChangesDetected,
}: devolutionBase) {
  const inventory_outputs = [] as DocumentSnapshot<outputType>[];
  const [devo, setDevo] = useState(0);
  const [lastHasInventory, setLastHasInventory] = useState<boolean | undefined>(
    sellerHasInventory
  );
  const lastCustomPrice = useRef(customPrice);
  const humanAmountChanged = useRef(false);
  const devoDebounce = useDebounce(devo);

  useEffect(() => {
    if (devoDebounce != currentDevolution) setDevo(currentDevolution);
    console.log(
      "current devo and devo debounce",
      currentDevolution,
      devoDebounce
    );
  }, [currentDevolution]);

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

    saveDevolution(
      invoiceDoc,
      productDoc,
      seletedSeller,
      inventory_outputs,
      outputs,
      devoDebounce as number,
      customPrice,
      setRemainStock,
      humanAmountChanged,
      currentDevolution
    );
  }, [customPrice, seletedSeller, devoDebounce, outputs]);

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
