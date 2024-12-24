import Link from "next/link";
import styled from "styled-components";
import { globalCSSVars } from "./colors";

export const Nav = styled.nav`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 50px;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${globalCSSVars["--background"]};
  border-right: 2px ${globalCSSVars["--foreground"]} solid;
`;

export const NavAnchor = styled(Link)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  transition: all 200ms ease;

  &:hover {
    transform: scale(1.2);
    background-color: #fff2;
  }
  &:active {
    transform: scale(0.8);
  }
`;

export const NavContainer = styled.div<{ deployNav: boolean }>`
  display: grid;
  grid-template-columns: ${({ deployNav }) => (deployNav ? "200px" : "60px")} 1fr;
  width: 100%;
  height: 100vh;
  overflow: scroll;
  transition: all 200ms ease;
`;
