import {
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
} from "firebase/firestore";

export async function getDocFromCacheOnce<T>(ref: DocumentReference<T>) {
  return new Promise<DocumentSnapshot<T>>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      ref,
      {
        includeMetadataChanges: true,
      },
      (doc) => {
        resolve(doc);
        unsubscribe(); // solo una vez
      },
      reject
    );
  });
}
