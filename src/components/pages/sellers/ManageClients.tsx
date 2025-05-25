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
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
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

export function ManageClients({ sellerData, sellerDoc }: props) {
  const [clients, setClients] = useState<QueryDocumentSnapshot<client>[]>();
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
  });
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
    if (value === "create") {
      setSelectedClient(undefined);
    } else {
      const theClient = clients.find((el) => el.id === value);
      setSelectedClient(theClient);
    }
  }

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function hanlderOnSubmit(e: FormEvent) {
    e.preventDefault();

    if (!sellerDoc) return;

    const clientDataToSave = {
      name: formData.name,
      phone_number: formData.phone_number,
      address: formData.address,
    };

    if (selectedClient) {
      await updateClient(selectedClient.ref, clientDataToSave);
      setSuccessfully(`${formData.name} se actualizó correctamente`);
    } else {
      if (!formData.name) {
        // Basic validation example, can be expanded
        alert("El nombre del cliente es obligatorio.");
        return;
      }
      const ref = await createClient(sellerDoc?.id, clientDataToSave);

      setSuccessfully(`${formData.name} se creó correctamente`);
      setCreatedClientAsDefault(ref.id);
      setCreatedClient(ref.id);
    }

    formRef.current?.reset();
  }

  // Effect to populate formData when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      const data = selectedClient.data();
      setFormData({
        name: data.name,
        phone_number: data.phone_number || "",
        address: data.address || "",
      });
      // Clear createdClientAsDefault once selectedClient is set from it
      if (
        createdClientAsDefault &&
        selectedClient.id === createdClientAsDefault
      ) {
        setCreatedClientAsDefault(undefined);
      }
    } else {
      setFormData({
        name: "",
        phone_number: "",
        address: "",
      });
    }
  }, [selectedClient, createdClientAsDefault]);

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
        // If a new client was just created
        const newClient = docs.find((el) => el.id === createdClient);
        setSelectedClient(newClient);
        if (newClient) {
          // Clear createdClient after it has been used to set selectedClient
          setCreatedClient(undefined);
        }
      }
      setClients(snap.docs);
    });

    return () => {
      unsubcribe();
    };
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
                  {
                    name: "Crear nuevo cliente",
                    value: "create",
                    selected: !selectedClient && !createdClientAsDefault,
                  },
                  ...clients.map((el) => {
                    const data = el.data();
                    return {
                      name: data.name,
                      value: el.id,
                      selected:
                        selectedClient?.id === el.id ||
                        createdClientAsDefault === el.id,
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
                    name="name"
                    marginBottom="0px"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  >
                    Nombre
                  </InputText>
                </Container>
                <InputText
                  name="phone_number"
                  marginBottom="0px"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                >
                  Número de telefono
                </InputText>
              </FlexContainer>
              <p>Dirección</p>
              <textarea
                name="address"
                style={{ width: "100%", padding: "5px", minHeight: "60px" }}
                value={formData.address}
                onChange={handleInputChange}
              />
              {/* <textarea
                name="address"
                style={{ width: "100%", padding: "5px" }}
                defaultValue={selectedClient?.data().address}
              /> */}
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
