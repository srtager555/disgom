import { GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";

export const CreditHeader = () => (
  <GridContainer $gridTemplateColumns="repeat(4, 75px) 1fr">
    <Column gridColumn="1 / 3">Nombre</Column>
    <Column>Cobros</Column>
    <Column>Creditos</Column>
    <Column title="Diferencias">Diferencias</Column>
  </GridContainer>
);
