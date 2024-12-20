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
