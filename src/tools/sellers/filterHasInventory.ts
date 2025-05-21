import { QueryDocumentSnapshot } from "firebase/firestore";
import { SellersDoc } from "./create";

export const filterSellerHasInventory = (
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>,
  condition: boolean
) => {
  return sellers.filter((el) => el.data().hasInventory === condition);
};
