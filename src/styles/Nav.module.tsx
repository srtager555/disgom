import Link from "next/link";
import styled, { css } from "styled-components";
import { globalCSSVars } from "./colors";

export const Nav = styled.nav`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 50px;
  width: 100%;
  padding: 10px 0;
  background: ${globalCSSVars["--background"]};
  border: 2px ${globalCSSVars["--foreground"]} solid;
  border-radius: 15px;
`;

export const NavAnchor = styled(Link)<{ $active?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  transition: all 200ms ease;
  ${(props) =>
    props.$active &&
    css`
      background-color: ${globalCSSVars["--foreground-hover"]};
    `}

  & > * {
    transition: all 200ms ease;
    ${(props) =>
      props.$active &&
      css`
        transform: scale(1.2);
      `}

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(0.9);
    }
  }

  &:hover {
    background-color: ${globalCSSVars["--foreground-hover"]};
  }
`;

export const NavContainer = styled.div<{ $deployNav: boolean }>`
  display: grid;
  grid-template-columns: ${({ $deployNav }) => ($deployNav ? "200px" : "60px")} 1fr 60px;
  width: 100%;
  height: 100vh;
  overflow: scroll;
  transition: all 200ms ease;
  padding: 10px;
`;
