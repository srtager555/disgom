/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

let db: ReturnType<typeof initializeFirestore> | null = null;

export function Firestore() {
  if (!db) {
    const app = getApp();
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    if (process.env.NODE_ENV === "development") {
      // @ts-ignore
      if (typeof window === "undefined" || !window._firestore) {
        connectFirestoreEmulator(db, "localhost", 8080);

        if (typeof window !== "undefined") {
          // @ts-ignore
          window._firestore = true;
        }
      }
    }
  }

  return db;
}
