import { DocumentReference, updateDoc } from "firebase/firestore";
import { outputType } from "./addOutputs";

export async function disableOutput(ref: DocumentReference<outputType>) {
  await updateDoc(ref, {
    disabled: true,
  });
}
