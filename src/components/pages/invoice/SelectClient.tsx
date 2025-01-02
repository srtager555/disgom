import { InputNumber } from "@/components/Inputs/number";
import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { getClients } from "@/tools/sellers/getClients";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";

const InvoiceInfo = styled.div`
  display: inline-block;
  padding: 15px;
  border: solid 2px ${globalCSSVars["--detail"]};
  border-radius: 20px;
  margin-top: 20px;
`;

const SelectContainer = styled.div`
  display: inline-block;
  & > div p {
    display: inline;
    margin-right: 10px;
  }
`;

interface props {
  sellerData: SellersDoc | undefined;
  sellerDoc: QueryDocumentSnapshot<SellersDoc> | undefined;
}

export function SelectClient({ sellerData, sellerDoc }: props) {
  const [clients, setClients] = useState<QueryDocumentSnapshot<client>[]>();

  useEffect(() => {
    async function getClientss() {
      if (!sellerDoc) return;
      const c = await getClients(sellerDoc?.id);
      setClients(c.docs);
    }

    getClientss();
  }, [sellerDoc]);

  return (
    <>
      {!sellerData?.hasInventory && clients && (
        <Container styles={{ marginBottom: "20px" }}>
          <InvoiceInfo>
            <SelectContainer>
              <Select
                options={[
                  {
                    name: "Crear cliente nuevo",
                    value: "",
                    ...clients.map((el) => {
                      const data = el.data();

                      return {
                        name: data.name,
                        value: el.id,
                      };
                    }),
                  },
                ]}
              >
                Selecciona un cliente
              </Select>
            </SelectContainer>
            <Container>
              <FlexContainer>
                <Container
                  styles={{ marginRight: "20px", marginBottom: "10px" }}
                >
                  <InputText marginBottom="0px">Nombre</InputText>
                </Container>
                <InputNumber marginBottom="0px">Número de telefono</InputNumber>
              </FlexContainer>
              <p>Dirección</p>
              <textarea style={{ width: "100%" }} />
            </Container>
          </InvoiceInfo>
        </Container>
      )}
    </>
  );
}
