import { GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";

export const CreditHeader = () => (
  <GridContainer $gridTemplateColumns="repeat(3, 95px)">
    {/* <Column gridColumn="1 / 3">Nombre</Column> */}
    <Column>Cobros</Column>
    <Column>Creditos</Column>
    <Column title="Diferencias">Diferencias</Column>
  </GridContainer>
);
