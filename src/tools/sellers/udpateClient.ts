import { updateDoc, DocumentReference } from "firebase/firestore";
import { client } from "./createClient";

export async function updateClient(
  client_ref: DocumentReference<client>,
  data: client
) {
  return await updateDoc(client_ref, data);
}
