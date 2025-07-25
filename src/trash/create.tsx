import { Select } from "@/components/Inputs/select";
import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import {
  ProductList,
  productResult,
} from "@/components/pages/invoice/ProductList";
import { Result } from "@/components/pages/invoice/Result";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { NextPageWithLayout } from "@/pages/_app";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { createInvoice, invoiceType } from "@/tools/invoices/createInvoice";
import { disableInvoice } from "@/tools/invoices/disableInvoice";
import { addOutputs } from "@/tools/products/addOutputs";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useRouter } from "next/router";
import {
  ChangeEvent,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";

const SellersSelect = styled(FlexContainer)`
  align-items: center;
  justify-content: flex-start;

  & > div select {
    margin-left: 10px;
    font-size: 1.5rem;
    font-weight: bold;
  }
`;

export const InvoiceContext = createContext<{
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
}>({
  selectedSeller: undefined,
});

const Page: NextPageWithLayout = () => {
  const sellers = useGetSellers();
  const sellersDocs = useMemo(() => sellers?.docs, [sellers]);
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>();
  const [sellerDoc, setSellerDoc] =
    useState<QueryDocumentSnapshot<SellersDoc>>();
  const sellerData = useMemo(() => sellerDoc?.data(), [sellerDoc]);
  const [productsResults, setProductsResults] = useState<
    Record<string, productResult>
  >({});
  const [client, setClient] = useState<QueryDocumentSnapshot<client> | null>(
    null
  );
  const [isCredit, setIsCredit] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<
    DocumentSnapshot<invoiceType> | undefined
  >();
  const invoiceToEditData = useMemo(
    () => invoiceToEdit?.data(),
    [invoiceToEdit]
  );
  const router = useRouter();
  const { id } = useQueryParams();

  function selectSeller(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedSeller(e.target.value);
  }

  async function handlerCreateInvoice() {
    if (!sellerDoc || !productsResults) return;

    const productResultValues = Object.values(productsResults);
    const totals = productResultValues.reduce(
      (before, now) => {
        return {
          total_cost: before.total_cost + now.cost,
          total_sold: before.total_sold + now.sold.total,
          total_profit: before.total_profit + now.profit,
        };
      },
      {
        total_cost: 0,
        total_sold: 0,
        total_profit: 0,
      }
    );

    const invoiceData: invoiceType = {
      created_at:
        invoiceToEditData?.created_at || Timestamp.fromDate(new Date()),
      seller_ref: sellerDoc?.ref,
      client_ref: client?.ref || null,
      inventory_ref: null,
      products_outputs: [],
      last_inventory_ref: invoiceToEditData?.last_inventory_ref || null,
      total_cost: {
        normal: totals.total_cost,
        withInventory: totals.total_cost,
      },
      total_sold: {
        normal: totals.total_sold,
        withInventory: totals.total_sold,
      },
      total_proft: {
        normal: totals.total_profit,
        withInventory: totals.total_profit,
      },
      route: invoiceToEditData?.route || null,
      bills: invoiceToEditData?.bills || null,
      money: invoiceToEditData?.money || null,
      credit: sellerDoc.data().hasInventory
        ? null
        : {
            paid: isCredit,
            paid_at: isCredit ? Timestamp.fromDate(new Date()) : null,
          },
      newCredits: invoiceToEditData?.newCredits || null,
      disabled: false,
    };

    if (invoiceToEdit) await disableInvoice(invoiceToEdit);
    const invoiceRef = await createInvoice(invoiceData);

    // add the outputs to the invoice
    const productResultEntries = Object.entries(productsResults);
    productResultEntries.forEach(
      async (el) => await addOutputs(invoiceRef, el[0], el[1])
    );

    router.push("/invoices");
  }

  // effect to get the selected seller doc
  useEffect(() => {
    if (!selectedSeller) return;

    const sellerDoc = sellersDocs?.find((el) => el.id === selectedSeller);
    setSellerDoc(sellerDoc);
  }, [selectedSeller, sellersDocs]);

  // ------ effects to manage the edit mode -------

  // effect to update the selectSeller
  useEffect(() => {
    if (!invoiceToEditData) return;

    setSelectedSeller(invoiceToEditData.seller_ref.id);
  }, [invoiceToEditData]);

  // effect to get the invoice to edit
  useEffect(() => {
    async function getInvoiceToEdit() {
      if (!id) return;

      const db = Firestore();
      const docRef = doc(
        db,
        InvoiceCollection.root,
        id
      ) as DocumentReference<invoiceType>;
      const invoiceData = await getDoc(docRef);

      setInvoiceToEdit(invoiceData);
    }
    getInvoiceToEdit();
  }, [id]);

  return (
    <InvoiceContext.Provider value={{ selectedSeller: sellerDoc }}>
      <Container>
        <SellersSelect>
          <h2 style={{ margin: "0" }}>Factura para</h2>
          <Select
            marginBottom="0px"
            onChange={selectSeller}
            disabled={id ? true : false}
            options={
              !sellers
                ? [{ name: "Cargando...", value: "none" }]
                : [
                    { name: "--Elegir", value: "" },
                    ...sellers.docs.map((el) => {
                      const data = el.data();
                      return {
                        name: data.name,
                        value: el.id,
                        selected: invoiceToEditData?.seller_ref.id === el.id,
                      };
                    }),
                  ]
            }
          />
        </SellersSelect>
        <SelectClient
          sellerDoc={sellerDoc}
          sellerData={sellerData}
          setClient={setClient}
          invoiceDataToEdit={invoiceToEditData}
        />
        {!selectedSeller ? (
          <h3 style={{ marginTop: "10px" }}>
            Para empezar selecciona para quien será la factura
          </h3>
        ) : (
          <>
            <ProductList
              invoiceToEditData={invoiceToEditData}
              setProductsResults={setProductsResults}
            />

            <Result
              hasInventory={sellerData?.hasInventory}
              productsResults={productsResults}
            />
            <Container styles={{ marginTop: "20px", marginBottom: "100px" }}>
              {!sellerDoc ? (
                <h2>
                  <i>
                    Se debe de seleccionar un vendedor para crear la factura
                  </i>
                </h2>
              ) : (
                <>
                  <h2>Resumen</h2>
                  <p style={{ marginBottom: "10px" }}>
                    Factura de {sellerData?.name}
                    {!sellerData?.hasInventory &&
                      (client ? (
                        ` para ${client?.data().name}`
                      ) : (
                        <i>
                          <b>
                            . Se debe seleccionar el cliente que pertenecera
                            esta factura
                          </b>
                        </i>
                      ))}
                  </p>
                  <p style={{ marginBottom: "10px" }}>
                    {sellerData?.hasInventory ? (
                      "Esta factura esperará a futuro un inventario para hacer un cierre"
                    ) : (
                      <label>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            setIsCredit(e.target.checked);
                          }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: "10px",
                          }}
                        >
                          ¿Esta factura será cancelada ahora?
                        </span>
                      </label>
                    )}
                  </p>
                </>
              )}
              {Object.values(productsResults).length === 0 && (
                <p
                  style={{
                    marginBottom: "10px",
                    fontWeight: "bold",
                    fontStyle: "italic",
                  }}
                >
                  La Factura no tiene ningun producto seleccionado
                </p>
              )}
              <Button
                style={{ marginTop: "10px" }}
                onClick={handlerCreateInvoice}
                disabled={
                  Object.values(productsResults).length === 0
                    ? true
                    : !sellerData
                    ? true
                    : !sellerData.hasInventory
                    ? !client
                      ? true
                      : false
                    : false
                }
              >
                {invoiceToEdit ? "Editar factura" : "Crear Factura"}
              </Button>
            </Container>
          </>
        )}
      </Container>
    </InvoiceContext.Provider>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;
