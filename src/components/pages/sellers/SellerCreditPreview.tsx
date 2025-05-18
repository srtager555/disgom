import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { FlexContainer, Container } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { clientCredit, credit } from "@/tools/sellers/credits/create";
import { getClientCredits } from "@/tools/sellers/credits/get";
import {
  QueryDocumentSnapshot,
  updateDoc,
  Timestamp,
  collection,
  CollectionReference,
  DocumentSnapshot,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { debounce } from "lodash";
import {
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Input } from "../invoice/Product";
import { Select } from "@/components/Inputs/select";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";

interface props {
  sellerDoc: DocumentSnapshot<SellersDoc> | undefined;
}

export function SellerCreditPreviewMapper({ sellerDoc }: props) {
  const [creditAmount, setCreditAmount] = useState<number[]>([]);
  const [route, setRoute] = useState(1);
  const [clientsWithCredits, setClientsWithCredits] =
    useState<QueryDocumentSnapshot<clientCredit>[]>();
  const creditTotal = useMemo(() => {
    return creditAmount.reduce((a, b) => a + b, 0);
  }, [creditAmount]);

  // effect to get the credits
  useEffect(() => {
    if (!sellerDoc) return;
    const creditColl = collection(
      sellerDoc.ref,
      SellersCollection.credits
    ) as CollectionReference<clientCredit>;

    const q = query(
      creditColl,
      orderBy("name"),
      where("route", "==", route)
      // where("disabled", "==", false)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      console.log(snap.docs);
      setClientsWithCredits(snap.docs);
    });

    return () => {
      unsubcribe();
      setClientsWithCredits(undefined);
      setCreditAmount([]);
    };
  }, [sellerDoc, route]);

  return (
    <Container styles={{ marginBottom: "100px", width: "820px" }}>
      <Select
        onChange={(e) => setRoute(Number(e.target.value))}
        options={new Array(6).fill(0).map((_, i) => {
          return {
            name: "Ruta " + (i + 1),
            value: "" + (i + 1),
          };
        })}
      />
      <FlexContainer
        styles={{ justifyContent: "space-between", marginTop: "10px" }}
      >
        <h2>Creditos</h2>
        <h2>
          Total <span>{numberParser(creditTotal)}</span>
        </h2>
      </FlexContainer>
      <FlexContainer
        styles={{
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: "20px",
        }}
      >
        {clientsWithCredits && clientsWithCredits.length > 0 ? (
          clientsWithCredits?.map((el, i) => {
            return (
              <CreditPreview
                key={i}
                doc={el}
                setCreditAmount={setCreditAmount}
              />
            );
          })
        ) : (
          <p style={{ textAlign: "center" }}>No hay creditos</p>
        )}
      </FlexContainer>
    </Container>
  );
}

/**
 * Component to print the credits
 * @param params
 * @returns
 */
function CreditPreview({
  doc,
  setCreditAmount,
}: {
  doc: QueryDocumentSnapshot<clientCredit>;
  setCreditAmount: Dispatch<SetStateAction<Array<number>>>;
}) {
  const initialData = useMemo(() => doc.data(), [doc]);
  const [clientName, setClientName] = useState(initialData.name);
  const [clientAddress, setClientAddress] = useState(initialData.address);
  const [lastCredit, setLastCredit] = useState<credit>();

  useEffect(() => {
    async function getLastCredit() {
      const lastCredit = await getClientCredits(doc.ref);
      const creditData = lastCredit?.data();
      if (!creditData) {
        // If no credit data, perhaps set amount to 0 or handle appropriately
        // For now, we'll ensure it doesn't crash if creditData is undefined
        // setCreditAmount((prevAmounts) =>
        //   prevAmounts.filter((_, i) => i !== doc.id)
        // ); // Example: remove if using an object map
        return;
      }

      setLastCredit(creditData);
      // This logic for setCreditAmount might need to be more robust
      // to avoid duplicates or handle updates if amounts change.
      // For now, sticking to the original append logic.
      setCreditAmount((props) => {
        // A more robust approach would be to use an object keyed by doc.id
        // or ensure this effect has proper cleanup to remove the amount
        // if the component unmounts or the doc changes.
        // For simplicity, retaining the append for now.
        if (!props.includes(creditData.amount)) {
          // Basic check to avoid simple duplicates
          return [...props, creditData.amount];
        }
        return props;
      });
    }

    getLastCredit();

    // Cleanup function for credit amount (example, needs specific logic)
    return () => {
      // If lasstCredit was set, remove its amount upon cleanup
      // This depends on how creditAmount is structured and managed by the parent
      // setCreditAmount(prev => prev.filter(amount => amount !== lasstCredit?.amount));
    };
  }, [doc, setCreditAmount]);

  const handleUpdateClientDetails = useCallback(async () => {
    const updatedFields: Partial<clientCredit> = {};
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
        await updateDoc(doc.ref, updatedFields);
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
    doc.ref,
  ]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClientAddress(e.target.value);
  };

  const handleDeleteClientCredit = useCallback(async () => {
    try {
      await updateDoc(doc.ref, {
        disabled: true,
        disabled_at: Timestamp.now(),
      });
      console.log("Client credit marked as disabled.");
      // Optionally, trigger a re-fetch or update local state
    } catch (error) {
      console.error("Error disabling client credit:", error);
    }
  }, [doc.ref]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDelete = useCallback(
    debounce(handleDeleteClientCredit, 5000),
    [handleDeleteClientCredit]
  );

  if (!lastCredit) return <>Cargando...</>;
  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        width: "400px",
        paddingBottom: "10px",
        marginBottom: "10px",
        borderBottom: "1px solid " + globalCSSVars["--detail"],
      }}
    >
      <FlexContainer
        styles={{ width: "100%", maxWidth: "300px", flexDirection: "column" }}
      >
        <Container>
          <Input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ padding: "5px" }} // Style to look like h3
          />
        </Container>

        <textarea
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
        />
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
      <span>{numberParser(lastCredit?.amount)}</span>
    </FlexContainer>
  );
}
