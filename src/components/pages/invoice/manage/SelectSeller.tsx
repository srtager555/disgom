import { Select } from "@/components/Inputs/select";
import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";

type SelectSellerProps = {
  setSelectedSeller: Dispatch<
    SetStateAction<QueryDocumentSnapshot<SellersDoc> | undefined>
  >;
  currentSeller: DocumentSnapshot<SellersDoc> | undefined;
};

const SelectContainer = styled(FlexContainer)<{ column?: boolean }>`
  flex-direction: ${(props) => (props.column ? "column" : "row")};
  align-items: center;
  justify-content: center;

  & > div select {
    font-size: 1.5rem;
    margin-left: ${(props) => (props.column ? "0px" : "12px")};
  }
`;

export function SelectSeller({
  setSelectedSeller,
  currentSeller,
}: SelectSellerProps) {
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const seller_id = useMemo(() => invoice?.data().seller_ref.id, [invoice]);
  const sellers = useGetSellers();
  const [lastSellerID, setLastSellerID] = useState<string>();

  const findTheSeller = useCallback(
    (id: string) => {
      if (id === "" || !sellers) return;
      return sellers.docs.find((el) => el.id === id);
    },
    [sellers]
  );

  // function to selecte a seller
  const selectSeller = useCallback(
    (e: ChangeEvent<HTMLSelectElement> | string) => {
      const value = typeof e === "string" ? e : e.target.value;
      const selectedSeller = findTheSeller(value);

      setSelectedSeller(selectedSeller);
      setLastSellerID(value);
    },
    [findTheSeller, setSelectedSeller]
  );

  // effect to set a seller if there is a current seller
  useEffect(() => {
    if (currentSeller && currentSeller.id !== lastSellerID) {
      selectSeller(currentSeller.id);
    }
  }, [currentSeller, lastSellerID, selectSeller]);

  // effect to select the seller when the invoice is already created
  useEffect(() => {
    if (seller_id) setSelectedSeller(findTheSeller(seller_id));
  }, [findTheSeller, seller_id, setSelectedSeller]);

  return (
    <SelectContainer column={!currentSeller ? true : false}>
      {currentSeller ? (
        <h1 style={{ margin: "0", textAlign: "center" }}>Factura de</h1>
      ) : (
        <>
          <h1 style={{ textAlign: "center" }}>
            ¡Es hora de crear una factura!
          </h1>
          <p>Selecciona un vendedor para crear una factura</p>
        </>
      )}
      <Select
        marginBottom="0px"
        onChange={selectSeller}
        options={
          !sellers
            ? [{ name: "Cargando...", value: "" }]
            : [
                { name: "--Elegir", value: "" },
                ...sellers.docs.map((el) => {
                  const data = el.data();
                  return {
                    name: data.name,
                    value: el.id,
                    selected:
                      seller_id === el.id || currentSeller?.id === el.id,
                  };
                }),
              ]
        }
      />
    </SelectContainer>
  );
}
