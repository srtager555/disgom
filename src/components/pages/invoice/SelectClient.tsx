import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { globalCSSVars } from "@/styles/colors";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { client, createClient } from "@/tools/sellers/createClient";
import {
  collection,
  CollectionReference,
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
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
  setClient: Dispatch<SetStateAction<client>>;
}

export function SelectClient({ sellerData, sellerDoc }: props) {
  const [clients, setClients] = useState<QueryDocumentSnapshot<client>[]>();
  const [selectedClient, setSelectedClient] = useState<client | undefined>();
  const [createdClient, setCreatedClient] = useState<string | undefined>();
  const [createdClientAsDefault, setCreatedClientAsDefault] = useState<
    string | undefined
  >(undefined);

  function selectTheClient(e: ChangeEvent<HTMLSelectElement> | string) {
    const value = typeof e === "string" ? e : e.target.value;

    if (value === "create") {
      setSelectedClient(undefined);
    } else if (clients) {
      const theClient = clients.find((el) => el.id === value);
      setSelectedClient(theClient?.data());
    }
  }

  async function hanlderOnCreate(e: FormEvent) {
    e.preventDefault();

    if (!sellerDoc) return;

    const { clientName, phoneNumber, address } = e.target as typeof e.target & {
      clientName: HTMLInputElement;
      phoneNumber: HTMLInputElement;
      address: HTMLTextAreaElement;
    };

    const ref = await createClient(sellerDoc?.id, {
      name: clientName.value,
      phone_number: phoneNumber.value,
      address: address.value,
    });

    setCreatedClientAsDefault(ref.id);
    setCreatedClient(ref.id);
  }

  useEffect(() => {
    if (!sellerDoc) return;

    const db = Firestore();
    const docRef = doc(db, SellersCollection.root, sellerDoc.id);
    const coll = collection(
      docRef,
      SellersCollection.clients
    ) as CollectionReference<client>;

    const unsubcribe = onSnapshot(coll, (snap) => {
      const docs = snap.docs;

      if (createdClient) {
        const newClient = docs.find((el) => el.id === createdClient)?.data();
        setSelectedClient(newClient);
      }

      setClients(snap.docs);
    });

    return unsubcribe;
  }, [createdClient, sellerDoc]);

  return (
    <>
      {!sellerData?.hasInventory && clients && (
        <Container styles={{ marginBottom: "20px" }}>
          <InvoiceInfo>
            <SelectContainer>
              <Select
                onChange={selectTheClient}
                options={[
                  { name: "Crear nuevo cliente", value: "create" },
                  ...clients.map((el) => {
                    const data = el.data();
                    return {
                      name: data.name,
                      value: el.id,
                      selected: createdClientAsDefault === el.id,
                    };
                  }),
                ]}
              >
                Selecciona un cliente
              </Select>
            </SelectContainer>

            <Form onSubmit={hanlderOnCreate}>
              <FlexContainer>
                <Container
                  styles={{ marginRight: "20px", marginBottom: "10px" }}
                >
                  <InputText
                    name="clientName"
                    marginBottom="0px"
                    required
                    defaultValue={selectedClient?.name}
                  >
                    Nombre
                  </InputText>
                </Container>
                <InputText
                  name="phoneNumber"
                  marginBottom="0px"
                  defaultValue={selectedClient?.phone_number}
                >
                  Número de telefono
                </InputText>
              </FlexContainer>
              <p>Dirección</p>
              <textarea
                name="address"
                style={{ width: "100%" }}
                defaultValue={selectedClient?.address}
              />
              <FlexContainer
                styles={{ justifyContent: "flex-end", marginTop: "10px" }}
              >
                <Button>
                  {" "}
                  {selectedClient
                    ? "Actualizar cliente"
                    : "Crear nuevo cliente"}
                </Button>
              </FlexContainer>
            </Form>
          </InvoiceInfo>
        </Container>
      )}
    </>
  );
}
