import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "./create";

// Helper function to sort sellers alphabetically by name
export const sortSellersByName = (
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>
): Array<QueryDocumentSnapshot<SellersDoc>> => {
  return [...sellers].sort((a, b) => {
    const nameA = a.data().name?.toLowerCase() || "";
    const nameB = b.data().name?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });
};
