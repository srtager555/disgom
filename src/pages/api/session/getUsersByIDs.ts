import { NextApiRequest, NextApiResponse } from "next";
import { UserRecord } from "firebase-admin/auth";
import { auth } from "@/tools/firestore/admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Asegúrate de que la petición sea POST para enviar los UIDs de forma segura
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { uids } = req.body;

  // Validar que se recibió un array de UIDs
  if (!Array.isArray(uids) || uids.length === 0) {
    return res
      .status(400)
      .json({ message: 'Missing or invalid "uids" array in request body.' });
  }

  try {
    const users: UserRecord[] = [];
    // Firebase Admin SDK permite obtener hasta 1000 usuarios por batch
    // Si tu lista de UIDs es muy grande, deberías paginarla
    const maxUidsPerBatch = 100;

    for (let i = 0; i < uids.length; i += maxUidsPerBatch) {
      const batchUids = uids.slice(i, i + maxUidsPerBatch);
      const userRecords = await auth.getUsers(
        batchUids.map((uid) => ({ uid }))
      );

      userRecords.users.forEach((userRecord) => {
        users.push(userRecord);
      });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users by UIDs:", error);
    // Errores específicos de Firebase pueden ser manejados aquí, por ejemplo, si un UID no existe
    if (
      error.code === "auth/invalid-uid" ||
      error.code === "auth/user-not-found"
    ) {
      return res
        .status(404)
        .json({ message: "One or more UIDs not found.", error: error.message });
    }
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
