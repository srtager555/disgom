import { JSX } from "react";
import styled from "styled-components";
import { Container } from "@/styles/index.styles";
import { globalCSSVars } from "@/styles/colors";

const SVGContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  & svg {
    fill: ${globalCSSVars["--detail"]};
  }
`;

export type iconType =
  | "seller"
  | "product"
  | "invoice"
  | "chart"
  | "home"
  | "addCircle";

interface I {
  iconType: iconType;
  height?: string;
  width?: string;
}

export const Icon = (props: I) => {
  const thesvg: Record<iconType, JSX.Element> = {
    addCircle: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
      </svg>
    ),
    home: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={props.height || "25px"}
        viewBox="0 -960 960 960"
        width={props.width || "25px"}
        fill="#e8eaed"
      >
        <path d="M226.67-186.67h140v-246.66h226.66v246.66h140v-380L480-756.67l-253.33 190v380ZM160-120v-480l320-240 320 240v480H526.67v-246.67h-93.34V-120H160Zm320-352Z" />
      </svg>
    ),
    seller: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={props.height || "25px"}
        viewBox="0 -960 960 960"
        width={props.width || "25px"}
        fill="#e8eaed"
      >
        <path d="M38-160v-94q0-35 18-63.5t50-42.5q73-32 131.5-46T358-420q62 0 120 14t131 46q32 14 50.5 42.5T678-254v94H38Zm700 0v-94q0-63-32-103.5T622-423q69 8 130 23.5t99 35.5q33 19 52 47t19 63v94H738ZM358-481q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42Zm360-150q0 66-42 108t-108 42q-11 0-24.5-1.5T519-488q24-25 36.5-61.5T568-631q0-45-12.5-79.5T519-774q11-3 24.5-5t24.5-2q66 0 108 42t42 108ZM98-220h520v-34q0-16-9.5-31T585-306q-72-32-121-43t-106-11q-57 0-106.5 11T130-306q-14 6-23 21t-9 31v34Zm260-321q39 0 64.5-25.5T448-631q0-39-25.5-64.5T358-721q-39 0-64.5 25.5T268-631q0 39 25.5 64.5T358-541Zm0 321Zm0-411Z" />
      </svg>
    ),
    product: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={props.height || "25px"}
        viewBox="0 -960 960 960"
        width={props.width || "25px"}
        fill="#e8eaed"
      >
        <path d="M446.67-163.67V-461l-260-150.33V-314l260 150.33Zm66.66 0 260-150.33v-298l-260 151v297.33ZM446.67-87 153.33-256q-15.66-9-24.5-24.33-8.83-15.34-8.83-33.34v-332.66q0-18 8.83-33.34 8.84-15.33 24.5-24.33l293.34-169q15.66-9 33.33-9 17.67 0 33.33 9l293.34 169q15.66 9 24.5 24.33 8.83 15.34 8.83 33.34v332.66q0 18-8.83 33.34-8.84 15.33-24.5 24.33L513.33-87q-15.66 9-33.33 9-17.67 0-33.33-9Zm196-526 93.66-54L480-815.33 386-761l256.67 148ZM480-518l95.33-55.67-257-148.33L223-667l257 149Z" />
      </svg>
    ),
    invoice: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={props.height || "25px"}
        viewBox="0 -960 960 960"
        width={props.width || "25px"}
        fill="#e8eaed"
      >
        <path d="M230-80q-45.83 0-77.92-32.08Q120-144.17 120-190v-130h120v-560h600v690q0 45.83-32.08 77.92Q775.83-80 730-80H230Zm499.94-66.67q18.39 0 30.89-12.45 12.5-12.46 12.5-30.88v-623.33H306.67V-320h380v130q0 18.42 12.44 30.88 12.44 12.45 30.83 12.45ZM360-626.67v-66.66h360v66.66H360Zm0 120v-66.66h360v66.66H360Zm-130.67 360H620v-106.66H186.67V-190q0 18.42 12.5 30.88 12.5 12.45 30.16 12.45Zm0 0h-42.66H620 229.33Z" />
      </svg>
    ),
    chart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={props.height || "25px"}
        viewBox="0 -960 960 960"
        width={props.width || "25px"}
        fill="#e8eaed"
      >
        <path d="M120-120v-77.33L186.67-264v144H120Zm163.33 0v-237.33L350-424v304h-66.67Zm163.34 0v-304l66.66 67.67V-120h-66.66ZM610-120v-236.33L676.67-423v303H610Zm163.33 0v-397.33L840-584v464h-66.67ZM120-346.33v-94.34l280-278.66 160 160L840-840v94.33L560-465 400-625 120-346.33Z" />
      </svg>
    ),
  };

  return <SVGContainer>{thesvg[props.iconType]}</SVGContainer>;
};
