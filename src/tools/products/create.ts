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
  last_sales_amounts: {
    purchase_price: number;
    sale_price: number;
    seller_commission: number;
  };
  created_at: Timestamp;
  units: productUnits;
  tags: string[];
  stock: stockType[] | [];
  step: string;
  disabled: boolean;
  position: number | null;
  followed: boolean;
};

type props = {
  product_ref: DocumentReference<productDoc> | undefined;
  name: string;
  product_parent: string | null;
  units?: productUnits | null;
  tags?: Array<string> | null;
  stepRaw?: string | null;
  followed: boolean;
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
  followed = false,
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
      followed,
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
    followed, // Added default value for followed
  });
}

export function unparseStep(numero: string): number {
  // Manejar el caso explícito "0" si significa 0 decimales (step "1")
  // Aunque parseStep(0) devuelve "1", mantenemos esto por si "0" es un input válido en otro contexto.
  if (numero === "0") {
    return 0;
  }

  // Encontrar el índice del punto decimal
  const decimalIndex = numero.indexOf(".");

  // Si no hay punto decimal (ej: "1"), el número de decimales es 0
  if (decimalIndex === -1) {
    return 0;
  }

  // Obtener la subcadena después del punto decimal
  const decimalPart = numero.substring(decimalIndex + 1);

  // El número de decimales es la longitud de la parte decimal
  return decimalPart.length;
}

function parseStep(largo: number): string {
  // Si el largo es 0 o negativo, el step es 1 (sin decimales)
  if (largo < 1) {
    return "1";
  }
  // Generar una cadena con el formato '0.0...1' basado en el largo.
  // largo = 1 -> "0.1"
  // largo = 2 -> "0.01"
  // largo = 3 -> "0.001"
  return "0." + "0".repeat(largo - 1) + "1";
}
