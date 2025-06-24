import {
  ServiceAccount,
  applicationDefault,
  cert,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceCredentials: ServiceAccount = require("../../../disgom-app-firebase-adminsdk-zafzh-0e36ae3976.json");

export function Firestore() {
  let db;

  try {
    db = getFirestore();
  } catch {
    let credentials = applicationDefault();

    if (process.env.NODE_ENV === "development") {
      credentials = cert(serviceCredentials);
    }

    initializeApp({
      credential: credentials,
      projectId: "smoothq-555",
    });
    db = getFirestore();

    db.settings({ preferRest: true });
  }

  return db;
}

// testing new function to manage the firestore admin
// lib/firebaseAdmin.js
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceCredentials),
    });
    console.log("Firebase Admin SDK inicializado correctamente.");
  } catch (error) {
    console.error("Error al inicializar Firebase Admin SDK:", error);
    // Puedes manejar el error de forma más robusta aquí, por ejemplo, saliendo del proceso
  }
}

export const auth = admin.auth();
