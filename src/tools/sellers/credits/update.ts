import {
  DocumentReference,
  updateDoc,
  PartialWithFieldValue,
} from "firebase/firestore";
import { credit } from "./create";

/**
 * Actualiza un documento de crédito en Firestore.
 *
 * @param ref - La referencia de Firestore al documento de crédito que se va a actualizar.
 * @param data - Un objeto con los campos del crédito que se desean modificar.
 *             Utiliza Partial<credit> para permitir actualizar solo algunos campos.
 * @returns Una promesa que se resuelve cuando la actualización se completa.
 */
export const updateCredits = async (
  ref: DocumentReference<credit>, // Asegúrate que 'credit' sea el tipo correcto de tu documento
  data: PartialWithFieldValue<credit> // PartialWithFieldValue permite usar FieldValue como deleteField(), serverTimestamp(), etc.
): Promise<void> => {
  await updateDoc(ref, data);
  console.log(`Crédito con ID ${ref.id} actualizado correctamente.`);
};
