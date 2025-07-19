import { onSnapshot, Query, QuerySnapshot } from "firebase/firestore";

export function getQueryFromCacheOnce<T>(
  q: Query<T>
): Promise<QuerySnapshot<T>> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        resolve(snapshot);
        unsubscribe(); // solo una vez
      },
      reject
    );
  });
}
