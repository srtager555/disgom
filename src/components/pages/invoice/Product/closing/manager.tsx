import { Container } from "@/styles/index.styles";
import { ProductClosing } from ".";
import {
  Descriptions,
  rawProductWithInventory,
} from "@/pages/invoices/closing";
import { useState } from "react";
import { inventory_product_data } from "@/tools/sellers/invetory/addProduct";

type props = {
  rawProducts: Record<string, rawProductWithInventory>;
};

export function ProductManager({ rawProducts }: props) {
  const [newInventoryToCreate, setNewInventoryToCreate] = useState<
    Record<string, inventory_product_data[]>
  >({});

  console.log(newInventoryToCreate);

  return (
    <Container styles={{ marginBottom: "30px" }}>
      <Descriptions />
      {Object.entries(rawProducts).map((el, i) => {
        const data = el[1];

        return (
          <ProductClosing
            key={i}
            data={data}
            product_id={el[0]}
            setNewInventoryToCreate={setNewInventoryToCreate}
          />
        );
      })}
    </Container>
  );
}
