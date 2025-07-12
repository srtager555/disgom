import { Container, FlexContainer } from "@/styles/index.styles";
import { AnalyzedCreditItem } from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { Input } from "../../invoice/Product";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { numberParser } from "@/tools/numberPaser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateDoc } from "firebase/firestore";
import { clientCreditBundleDocType } from "@/tools/sellers/credits/createClientForABundle";
import styled, { css } from "styled-components";

const CreditAmount = styled.span`
  display: inline-block;
  width: 30%;
  font-weight: bold;
  font-size: 1.1rem;
  text-align: right;
`;

const HiddenButtonContainer = styled(Container)<{ $show: boolean }>`
  position: absolute;
  transform: translateY(-50%);
  top: 50%;

  ${({ $show }) => {
    if ($show) {
      return css`
        right: -20px;
        opacity: 1;
      `;
    } else {
      return css`
        right: -100%;
        opacity: 0;
      `;
    }
  }}
`;

interface props {
  data: AnalyzedCreditItem;
}

export function ClientCredit({ data }: props) {
  const initialData = useMemo(() => data.client.data(), [data]);
  const [clientName, setClientName] = useState(initialData.name);
  const [clientAddress] = useState(initialData.address);
  const [showButtonToEditTheName, setShowButtonToEditTheName] = useState(false);
  const [succesufully, setSuccesufully] = useState(false);
  const [error, setError] = useState(false);
  const [noChanges, setNoChanges] = useState(false);
  const lastClienteNameRef = useRef(clientName);

  const handleUpdateClientDetails = useCallback(async () => {
    const updatedFields: Partial<clientCreditBundleDocType> = {};
    if (clientName.trim() !== initialData.name) {
      updatedFields.name = clientName.trim();
    }
    if (
      clientAddress !== initialData.address &&
      !(initialData.address === "not provided" && clientAddress === "")
    ) {
      updatedFields.address =
        clientAddress === "" ? "not provided" : clientAddress;
    }

    if (Object.keys(updatedFields).length > 0) {
      try {
        await updateDoc(data.client.ref, updatedFields);
        console.log("Client details updated successfully.");
        lastClienteNameRef.current = clientName;
        setSuccesufully(true);
        setShowButtonToEditTheName(false);

        setTimeout(() => {
          setSuccesufully(false);
        }, 2000);
      } catch (error) {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 2000);
        console.error("Error updating client details:", error);
      }
    } else {
      setNoChanges(true);
      setTimeout(() => {
        setNoChanges(false);
      }, 2000);
    }
  }, [
    clientName,
    clientAddress,
    initialData.name,
    initialData.address,
    data.client.ref,
  ]);

  // effect to listen the changes in clientName
  // to show the button to update the name
  useEffect(() => {
    if (lastClienteNameRef.current === clientName.trim()) {
      setShowButtonToEditTheName(false);
    } else {
      setShowButtonToEditTheName(true);
    }
  }, [clientName]);

  // const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   setClientAddress(e.target.value);
  // };

  // const handleDeleteClientCredit = useCallback(async () => {
  //   try {
  //     await updateDoc(data.client.ref, {
  //       disabled: true,
  //       disabled_at: Timestamp.now(),
  //     });
  //     console.log("Client credit marked as disabled.");
  //     // Optionally, trigger a re-fetch or update local state
  //   } catch (error) {
  //     console.error("Error disabling client credit:", error);
  //   }
  // }, [data.client.ref]);

  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        gap: "10px",
        width: "100%",
        padding: "10px 5px",
        marginBottom: "10px",
        borderBottom: "1px solid " + globalCSSVars["--detail"],
      }}
    >
      <FlexContainer styles={{ width: "100%", flexDirection: "column" }}>
        {succesufully && <p>*Se actualizo correctamente*</p>}
        {error && <p>*Ocurrio un problema*</p>}
        {noChanges && <p>*No se realizaron cambios*</p>}

        <Container>
          <Input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ padding: "5px", textAlign: "start" }} // Style to look like h3
          />
        </Container>
      </FlexContainer>
      <CreditAmount>{numberParser(data.current_credit ?? 0)}</CreditAmount>
      <HiddenButtonContainer $show={showButtonToEditTheName}>
        <Button $primary onClick={handleUpdateClientDetails}>
          Actualizar
        </Button>
      </HiddenButtonContainer>
    </FlexContainer>
  );
}
