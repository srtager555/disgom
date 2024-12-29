import { useGetSellers } from "@/hooks/sellers/getSellers";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { SellerContext } from "./Sellers.layout";

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
  const { setSellerSelected } = useContext(SellerContext);
  const sellers = useGetSellers();
  const [changeToEdit, setChangeToEdit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.asPath != "/sellers") {
      setChangeToEdit(false);
    } else setChangeToEdit(true);
  }, [router]);

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
                    {!changeToEdit ? (
                      <SeeMoreButton
                        onClick={() =>
                          setSellerSelected && setSellerSelected(el)
                        }
                      >
                        Seleccionar
                      </SeeMoreButton>
                    ) : (
                      <>
                        <CloseButton>Hacer Cierre</CloseButton>
                        <SeeMoreButton>Ver más</SeeMoreButton>
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
