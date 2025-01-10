import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { globalCSSVars } from "@/styles/colors";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import { client, createClient } from "@/tools/sellers/createClient";
import { updateClient } from "@/tools/sellers/udpateClient";
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
  useRef,
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
  setClient: Dispatch<SetStateAction<QueryDocumentSnapshot<client> | null>>;
}

export function SelectClient({ sellerData, sellerDoc, setClient }: props) {
  const [clients, setClients] = useState<QueryDocumentSnapshot<client>[]>();
  const [selectedClient, setSelectedClient] = useState<
    QueryDocumentSnapshot<client> | undefined
  >();
  const [createdClient, setCreatedClient] = useState<string | undefined>();
  const [createdClientAsDefault, setCreatedClientAsDefault] = useState<
    string | undefined
  >(undefined);
  const [successfully, setSuccessfully] = useState<string | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  function selectTheClient(e: ChangeEvent<HTMLSelectElement> | string) {
    const value = typeof e === "string" ? e : e.target.value;

    if (!clients) return;

    const theClient = clients.find((el) => el.id === value);
    setSelectedClient(theClient);
    setClient(theClient || null);
  }

  async function hanlderOnSubmit(e: FormEvent) {
    e.preventDefault();

    if (!sellerDoc) return;

    const { clientName, phoneNumber, address } = e.target as typeof e.target & {
      clientName: HTMLInputElement;
      phoneNumber: HTMLInputElement;
      address: HTMLTextAreaElement;
    };
    if (selectedClient) {
      await updateClient(selectedClient.ref, {
        name: clientName.value,
        phone_number: phoneNumber.value,
        address: address.value,
      });

      setSuccessfully(`${clientName.value} se actualizó correctamente`);
    } else {
      const ref = await createClient(sellerDoc?.id, {
        name: clientName.value,
        phone_number: phoneNumber.value,
        address: address.value,
      });

      setSuccessfully(`${clientName.value} se creó correctamente`);
      setCreatedClientAsDefault(ref.id);
      setCreatedClient(ref.id);
    }

    formRef.current?.reset();
  }

  //effect to crete a timeout for remove the successfully mesage
  useEffect(() => {
    if (successfully) {
      setTimeout(() => {
        setSuccessfully(undefined);
      }, 3000);
    }
  }, [successfully]);

  // efffect to manage the clients
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
        const newClient = docs.find((el) => el.id === createdClient);
        setSelectedClient(newClient);
      }

      setClients(snap.docs);
    });

    return () => {
      unsubcribe();
      setClient(null);
    };
  }, [createdClient, sellerDoc, setClient]);

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

            <Form onSubmit={hanlderOnSubmit} ref={formRef}>
              {successfully && (
                <Container
                  styles={{
                    padding: "5px",
                    border: "solid 1px green",
                    borderRadius: "10px",
                    color: "green",
                    marginBottom: "10px",
                  }}
                >
                  {successfully}
                </Container>
              )}
              <FlexContainer>
                <Container
                  styles={{ marginRight: "20px", marginBottom: "10px" }}
                >
                  <InputText
                    name="clientName"
                    marginBottom="0px"
                    required
                    defaultValue={selectedClient?.data().name}
                  >
                    Nombre
                  </InputText>
                </Container>
                <InputText
                  name="phoneNumber"
                  marginBottom="0px"
                  defaultValue={selectedClient?.data().phone_number}
                >
                  Número de telefono
                </InputText>
              </FlexContainer>
              <p>Dirección</p>
              <textarea
                name="address"
                style={{ width: "100%", padding: "5px" }}
                defaultValue={selectedClient?.data().address}
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
