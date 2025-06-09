import { iconType } from "@/components/Icons";
import { Nav } from "@/styles/Nav.module";
import { InvoicesNavSection } from "./InvoicesSection";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { ProductNavSection } from "./ProductsSection";
import { SellersNavSection } from "./SellersSections";
import { client } from "@/tools/sellers/createClient";
import { Anchors } from "./Anchors";

export interface NavElementData {
  href: string;
  name: string;
  icon?: iconType;
  mustBeAnchor?: boolean;
}

export interface NavElement extends NavElementData {
  // 👇 Children ahora es un Record o undefined
  children?: Record<string, NavElement>;
}

export const arrayToNavElementRecord = (
  arr: NavElementData[],
  keyPrefix: string = "item" // Prefijo para las claves generadas
): Record<string, NavElement> => {
  const record: Record<string, NavElement> = {};
  arr.forEach((item, index) => {
    // Usar un prefijo y el índice como clave. Considera usar item.href o un id si es más estable/único.
    const key = `${keyPrefix}-${item.href || index}`; // Usar href si existe, sino índice
    record[key] = { ...item }; // Copia las propiedades de NavElementData
  });
  return record;
};

interface props {
  sellers: QueryDocumentSnapshot<SellersDoc>[];
  clients: QueryDocumentSnapshot<client>[];
}

export function TheMotherFuckingNav({ sellers, clients }: props) {
  return (
    <Nav>
      <InvoicesNavSection sellers={sellers} clients={clients} />
      <ProductNavSection sellers={sellers} />
      <SellersNavSection sellers={sellers} clients={clients} />
      <Anchors href={"/signout"} name={"Cerrar sesión"} child={false} />
    </Nav>
  );
}
