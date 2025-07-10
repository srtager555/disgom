import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/tools/firestore/admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { uid, newPassword } = req.body;

  if (!uid || typeof uid !== "string") {
    return res.status(400).json({ message: "Missing or invalid 'uid'." });
  }

  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 6
  ) {
    return res.status(400).json({
      message:
        "La nueva contraseña debe tener al menos 6 caracteres. La contraseña que llego: " +
        newPassword,
    });
  }

  try {
    await auth.updateUser(uid, {
      password: newPassword,
    });

    return res.status(200).json({ message: "Contraseña actualizada." });
  } catch (error: any) {
    console.error("Error updating password:", error);
    if (error.code === "auth/user-not-found") {
      return res
        .status(404)
        .json({ message: "User not found.", error: error.message });
    }
    if (error.code === "auth/invalid-password") {
      return res.status(400).json({
        message: "The new password is too weak.",
        error: error.message,
      });
    }
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
