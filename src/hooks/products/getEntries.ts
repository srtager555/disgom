// import { ProductContext } from "@/components/layouts/Products.layout";
// import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
// import { entryDoc } from "@/tools/products/addEntry";
// import { productDoc } from "@/tools/products/create";
// import {
//   collection,
//   CollectionReference,
//   DocumentReference,
//   onSnapshot,
//   query,
//   QueryDocumentSnapshot,
//   QuerySnapshot,
// } from "firebase/firestore";
// import { useEffect, useState } from "react";

// export type entries = {
//   lastEntry: QueryDocumentSnapshot<entryDoc>;
//   entries: QuerySnapshot<entryDoc>;
// };

// export function useGetEntries(ref: DocumentReference<productDoc>) {
//   const [entries, setEntries] = useState<entries>();

//   useEffect(() => {
//     const coll = collection(
//       ref,
//       ProductsCollection.entry
//     ) as CollectionReference<entryDoc>;

//     const unsubcribe = onSnapshot(coll, (entries) => {
//       setEntries((props) => {
//         return {
//           ...props,
//           entries,
//         };
//       });
//     });

//     return () => unsubcribe();
//   }, []);

//   return "";
//}
