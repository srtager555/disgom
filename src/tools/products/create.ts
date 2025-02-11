import {
  addDoc,
  collection,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { DocumentReference } from "firebase/firestore";
import { stockType } from "./addToStock";

export type productUnits = "LB" | "KG" | "1/4" | "1/2" | "U";

export type productDoc = {
  name: string;
  product_parent: DocumentReference<productDoc>;
  created_at: Timestamp;
  units: productUnits;
  tags: string[];
  stock: stockType[] | [];
  step: string;
  disabled: boolean;
  position: number | null;
};

type props = {
  product_ref: DocumentReference<productDoc> | undefined;
  name: string;
  product_parent: string | null;
  units?: productUnits | null;
  tags?: Array<string> | null;
  stepRaw?: string | null;
};

/**
 * A function to create a product
 * @param name
 * @param tags
 * @returns The new product reference
 */
export async function createProduct({
  product_ref,
  product_parent = null,
  name,
  units = null,
  tags = null,
  stepRaw = null,
}: props) {
  const db = Firestore();
  const productColl = collection(db, ProductsCollection.root);
  let parent_ref = null;

  // if the product is a variation
  if (product_parent) {
    parent_ref = doc(productColl, product_parent);
  }

  // update any product
  if (product_ref) {
    return await updateDoc(product_ref, {
      name,
      product_parent: parent_ref,
      units,
      tags,
      step: parseStep(Number(stepRaw)),
    });
  }

  // normal product
  return await addDoc(productColl, {
    created_at: new Date(),
    product_parent: parent_ref,
    name,
    units,
    tags,
    stock: [],
    disabled: false,
    exclude: false,
    step: parseStep(Number(stepRaw)),
    position: null,
  });
}

export function unparseStep(numero: string): number {
  // Validar el formato de entrada
  if (numero === "0") {
    return 0;
  }
  // Contar la cantidad de ceros después del punto y antes del '1'
  return numero.split("1")[0].length - 2; // Restamos 2 para excluir "0."
}

function parseStep(largo: number): string {
  if (largo < 1) {
    return "1";
  }
  // Generar una cadena con el formato '0.0...1' basado en el largo.
  return "0." + "0".repeat(largo - 1) + "1";
}
