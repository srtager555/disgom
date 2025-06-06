import { Container, FlexContainer } from "@/styles/index.styles";
import { AnalyzedCreditItem } from "@/tools/sellers/credits/analyzeCreditSnapshots";
import { Input } from "../../invoice/Product";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { numberParser } from "@/tools/numberPaser";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { Timestamp, updateDoc } from "firebase/firestore";
import { clientCreditBundleDocType } from "@/tools/sellers/credits/createClientForABundle";

interface props {
  data: AnalyzedCreditItem;
}

export function ClientCredit({ data }: props) {
  const initialData = useMemo(() => data.client.data(), [data]);
  const [clientName, setClientName] = useState(initialData.name);
  const [clientAddress] = useState(initialData.address);

  const handleUpdateClientDetails = useCallback(async () => {
    const updatedFields: Partial<clientCreditBundleDocType> = {};
    if (clientName !== initialData.name) {
      updatedFields.name = clientName;
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
      } catch (error) {
        console.error("Error updating client details:", error);
      }
    }
  }, [
    clientName,
    clientAddress,
    initialData.name,
    initialData.address,
    data.client.ref,
  ]);

  // const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   setClientAddress(e.target.value);
  // };

  const handleDeleteClientCredit = useCallback(async () => {
    try {
      await updateDoc(data.client.ref, {
        disabled: true,
        disabled_at: Timestamp.now(),
      });
      console.log("Client credit marked as disabled.");
      // Optionally, trigger a re-fetch or update local state
    } catch (error) {
      console.error("Error disabling client credit:", error);
    }
  }, [data.client.ref]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDelete = useCallback(
    debounce(handleDeleteClientCredit, 5000),
    [handleDeleteClientCredit]
  );

  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        gap: "20px",
        width: "300px",
        paddingBottom: "10px",
        marginBottom: "10px",
        borderBottom: "1px solid " + globalCSSVars["--detail"],
      }}
    >
      <FlexContainer styles={{ width: "100%", flexDirection: "column" }}>
        <Container>
          <Input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ padding: "5px" }} // Style to look like h3
          />
        </Container>

        {/* <textarea
            value={clientAddress === "not provided" ? "" : clientAddress} // Handle "not provided" for placeholder effect
            onChange={handleAddressChange}
            placeholder="Dirección"
            rows={2}
            style={{
              fontSize: "1rem",
              marginTop: "5px",
              width: "100%",
              padding: "5px",
            }} // Style to look like small
          /> */}
        <FlexContainer
          styles={{ justifyContent: "space-between", marginTop: "10px" }}
        >
          <Button onClick={handleUpdateClientDetails}>Actualizar</Button>
          <Button
            $warn
            $hold
            onPointerDown={debouncedDelete}
            onPointerUp={debouncedDelete.cancel}
            onMouseLeave={debouncedDelete.cancel} // Also cancel if mouse leaves while pressed
          >
            Eliminar
          </Button>
        </FlexContainer>
      </FlexContainer>
      <span>{numberParser(data.current_credit ?? 0)}</span>
    </FlexContainer>
  );
}
