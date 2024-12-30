import { useGetSellers } from "@/hooks/sellers/getSellers";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { SellerContext } from "./Sellers.layout";
import useQueryParams from "@/hooks/getQueryParams";

const SellerButton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  width: 100%;
  margin-bottom: 15px;
  padding-left: 10px;
  border-radius: 10px;
  border: 2px solid ${globalCSSVars["--foreground"]};
  background-color: ${globalCSSVars["--background"]};
`;

const SeeMoreButton = styled.button`
  border: none;
  background-color: ${globalCSSVars["--highlight"]};
  font-size: 1.1rem;
  padding: 10px;
  color: #fff;
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const CloseButton = styled.button`
  border: none;
  background-color: ${globalCSSVars["--selected"]};
  color: #fff;
  font-size: 1.1rem;
  padding: 10px;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

export function SellersList() {
  const { sellerSelected, setSellerSelected } = useContext(SellerContext);
  const sellers = useGetSellers();
  const params = useQueryParams();
  const [changeToEdit, setChangeToEdit] = useState(false);
  const router = useRouter();

  function goToSellerData(sellerID: string) {
    router.push("/sellers?id=" + sellerID);
  }

  useEffect(() => {
    if (router.asPath == "/sellers/create") {
      setChangeToEdit(true);
    } else setChangeToEdit(false);

    if (setSellerSelected) setSellerSelected(undefined);
  }, [router, setSellerSelected]);

  if (Object.keys(params).length > 0) return <></>;

  return (
    <Container styles={{ marginTop: "50px" }}>
      <h2>Lista de Vendedores</h2>
      <Container>
        {!sellers
          ? "No hay vendedores"
          : sellers.docs.map((el, i) => {
              const data = el.data();
              return (
                <SellerButton key={i}>
                  {data.name}
                  <Container>
                    {changeToEdit ? (
                      <SeeMoreButton
                        onClick={() => {
                          if (!setSellerSelected) return;

                          if (sellerSelected?.id === el.id)
                            setSellerSelected(undefined);
                          else setSellerSelected(el);
                        }}
                      >
                        {sellerSelected?.id == el.id
                          ? "Deseleccionar"
                          : "Seleccionar"}
                      </SeeMoreButton>
                    ) : (
                      <>
                        <CloseButton>Hacer Cierre</CloseButton>
                        <SeeMoreButton onClick={() => goToSellerData(el.id)}>
                          Ver más
                        </SeeMoreButton>
                      </>
                    )}
                  </Container>
                </SellerButton>
              );
            })}
      </Container>
    </Container>
  );
}
