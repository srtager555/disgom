import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { useInvoice } from "@/contexts/InvoiceContext";
import { globalCSSVars } from "@/styles/colors";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { client, createClient } from "@/tools/sellers/createClient";
import { updateClient } from "@/tools/sellers/udpateClient";
import {
  collection,
  CollectionReference,
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
  updateDoc,
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

export function SelectClient({ sellerData, sellerDoc }: props) {
  const [client, setClient] = useState<QueryDocumentSnapshot<client> | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
  });
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
  const { invoice } = useInvoice();

  function selectTheClient(e: ChangeEvent<HTMLSelectElement> | string) {
    const value = typeof e === "string" ? e : e.target.value;

    if (!clients) return;
    if (value === "create") {
      setSelectedClient(undefined);
      setClient(null); // También limpiar el 'client' para la lógica de invoice
    } else {
      const theClient = clients.find((el) => el.id === value);
      setSelectedClient(theClient);
      setClient(theClient || null); // Sincronizar 'client' para la lógica de invoice
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
        alert("El nombre del cliente es obligatorio.");
        return;
      }
      const ref = await createClient(sellerDoc?.id, clientDataToSave);

      setSuccessfully(`${formData.name} se creó correctamente`);
      setCreatedClientAsDefault(ref.id);
      setCreatedClient(ref.id);
    }
    // No es necesario formRef.current?.reset() en formularios controlados;
    // el estado se maneja a través de selectedClient y formData.
    // Si se crea un nuevo cliente, selectedClient se actualizará y formData también.
    // Si se actualiza, formData ya refleja los cambios.
    // Si se quiere limpiar el formulario después de crear uno nuevo y antes de que
    // el onSnapshot actualice selectedClient, se podría hacer aquí:
    // if (!selectedClient) {
    //   setFormData({ name: "", phone_number: "", address: "" });
    // }
  }

  //effect to crete a timeout for remove the successfully mesage
  useEffect(() => {
    if (successfully) {
      setTimeout(() => {
        setSuccessfully(undefined);
      }, 3000);
    }
  }, [successfully]);

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
        // Si un cliente fue recién creado
        const newClient = docs.find((el) => el.id === createdClient);
        setSelectedClient(newClient);
        if (newClient) {
          // Limpiar createdClient después de que se haya usado
          setCreatedClient(undefined);
        }
      }

      setClients(snap.docs);
    });

    return () => {
      unsubcribe();
      setClient(null);
    };
  }, [createdClient, sellerDoc]); // Removido setClient de dependencias, ya que se maneja en selectTheClient o via invoice

  // ====== effects to manage the edit mode ======= //

  // Efecto para sincronizar selectedClient (y por ende el formulario) si 'client'
  // (que puede ser cargado desde la factura) cambia.
  useEffect(() => {
    if (client) {
      // Si hay un 'client' (posiblemente de la factura)
      if (!selectedClient || selectedClient.id !== client.id) {
        setSelectedClient(client); // Actualiza selectedClient para reflejarlo en el form
      }
    } else if (selectedClient && !createdClientAsDefault) {
      // Si no hay 'client' pero sí 'selectedClient' (y no es uno recién creado por defecto)
      setSelectedClient(undefined); // Limpiar el formulario si 'client' se vuelve null (ej. factura sin cliente)
    }
  }, [clients, client, setClient]);

  // effect to save the client in the invoice() {
  useEffect(() => {
    async function saveClient() {
      if (!client || !invoice) return;
      const data = invoice.data();

      if (client.ref.id === data?.client_ref?.id) return;

      await updateDoc(invoice.ref, {
        client_ref: client.ref,
      } as invoiceType);
    }

    saveClient();
  }, [client, invoice]);

  // effect to get the current client
  useEffect(() => {
    async function getCurrentClient() {
      const data = invoice?.data();
      const client_ref = data?.client_ref;

      if (!client_ref) return;

      const client = clients?.find((el) => el.id === client_ref.id);
      if (client) setClient(client);
    }

    getCurrentClient();
  }, [clients, invoice]);

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
                    selected:
                      !selectedClient && !createdClientAsDefault && !client, // Más preciso para "Crear nuevo"
                  },
                  ...clients.map((el) => {
                    const data = el.data();
                    return {
                      name: data.name,
                      value: el.id,
                      selected:
                        client?.id === el.id ||
                        createdClientAsDefault === el.id ||
                        selectedClient?.id === el.id, // Asegurar que selectedClient también controle esto
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
