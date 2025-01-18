import { Container } from "@/styles/index.styles";
import styled from "styled-components";
import { globalCSSVars } from "@/styles/colors";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { SellerContext } from "../layouts/sellers/Sellers.layout";
import { useGetSellers } from "@/hooks/sellers/getSellers";

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

// const CloseButton = styled.button`
//   border: none;
//   background-color: ${globalCSSVars["--selected"]};
//   color: #fff;
//   font-size: 1.1rem;
//   padding: 10px;
//   cursor: pointer;

//   &:hover {
//     transform: scale(1.1);
//   }

//   &:active {
//     transform: scale(0.9);
//   }
// `;

type props = {
  hasInventory?: boolean;
};

export function SellerListPrinter({ hasInventory = false }: props) {
  const sellers = useGetSellers();
  const { sellerSelected, setSellerSelected } = useContext(SellerContext);
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

  return !sellers
    ? "No hay vendedores"
    : sellers.docs
        .filter((el) => el.data().hasInventory === hasInventory)
        .map((el, i) => {
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
                    {/* {hasInventory && <CloseButton>Hacer Cierre</CloseButton>} */}
                    <SeeMoreButton onClick={() => goToSellerData(el.id)}>
                      Ver más
                    </SeeMoreButton>
                  </>
                )}
              </Container>
            </SellerButton>
          );
        });
}
