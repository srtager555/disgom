import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { AnchorNavigators } from "@/styles/Nav.module";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import styled from "styled-components";
import { Icon } from "../../Icons";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";

const Nav = styled.nav`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
`;

const Anchor = styled(AnchorNavigators)`
  font-size: 1.8rem;
  color: inherit;
  text-decoration: none;
  font-style: normal;
`;

const CreateAnchor = styled(Link)`
  display: flex;
  align-items: center;
  font-size: 1rem;
  padding: 3px 10px;
  margin-left: 20px;
  border-radius: 10px;

  background-color: ${globalCSSVars["--background"]};
  border: 3px solid ${globalCSSVars["--selected"]};

  &:hover {
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const IconContainer = styled.span`
  margin-right: 5px;
  & > div svg {
    /* fill: #fff; */
  }
`;

type props = {
  children: children;
};

type sellerSelected = QueryDocumentSnapshot<SellersDoc> | undefined;
type setSellerSelected = Dispatch<SetStateAction<sellerSelected>> | undefined;

export const SellerContext = createContext<{
  sellerSelected: sellerSelected;
  setSellerSelected: setSellerSelected;
}>({
  sellerSelected: undefined,
  setSellerSelected: undefined,
});

export function SellersLayout({ children }: props) {
  const [sellerSelected, setSellerSelected] =
    useState<sellerSelected>(undefined);
  const [showCreateAnchor, setShowCreateAnchor] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.asPath != "/sellers") {
      setShowCreateAnchor(false);
    } else setShowCreateAnchor(true);
  }, [router]);

  return (
    <SellerContext.Provider value={{ sellerSelected, setSellerSelected }}>
      <Container>
        <Nav>
          <Anchor href="/sellers">Vendedores</Anchor>
          {showCreateAnchor && (
            <CreateAnchor href="/sellers/create">
              <IconContainer>
                <Icon iconType="addCircle" />
              </IconContainer>
              Agregar nuevo
            </CreateAnchor>
          )}
        </Nav>
        {children}
      </Container>
    </SellerContext.Provider>
  );
}
