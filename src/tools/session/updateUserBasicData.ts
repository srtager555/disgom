import { userLevelsType } from "@/hooks/login/useCheckUserLevel";
import { collection, doc, updateDoc } from "firebase/firestore";
import { Firestore } from "../firestore";

export async function updateUserBasicData(
  uid: string,
  usarname: string,
  level: userLevelsType
) {
  const coll = collection(Firestore(), "users");
  const ref = doc(coll, uid);

  try {
    await updateDoc(ref, {
      username: usarname,
      level,
    });

    alert("Los datos se actualizaron correctamente.");
  } catch (error) {
    alert("Hubo un error al actualizar los datos.");
    console.error("Error al actualizar los datos:", error);
  }
}
