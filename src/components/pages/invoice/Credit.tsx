/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Select } from "@/components/Inputs/select";
import { Container, FlexContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { SellersDoc } from "@/tools/sellers/create";
import { clientCredit, credit } from "@/tools/sellers/credits/create";
import { getClientCredits, getCredits } from "@/tools/sellers/credits/get";
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "./Product";
import { Button, Form } from "@/styles/Form.styles";
import { InputText } from "@/components/Inputs/text";
import { InputNumber } from "@/components/Inputs/number";
import { globalCSSVars } from "@/styles/colors";
import { invoiceType } from "@/tools/invoices/createInvoice";

type props = {
  seller_ref: DocumentReference<SellersDoc>;
  setCreditTotal: Dispatch<SetStateAction<number>>;
  setNewCreditsToCreate: Dispatch<SetStateAction<newCredits[] | undefined>>;
  setCreditsToUpdate: Dispatch<SetStateAction<creditToUpdate[] | undefined>>;
  setRoute: Dispatch<SetStateAction<number | undefined>>;
  invoice: DocumentSnapshot<invoiceType> | undefined;
};

export type newCredits = {
  route: number;
  address: string;
  name: string;
  amount: number;
};

export type creditToUpdate = {
  amount: number;
  newAmount: number;
  previuss: DocumentReference<credit> | undefined;
  ref: DocumentReference<clientCredit>;
};

type allDiffs = Record<string, number | creditToUpdate>;

export function Credit({
  seller_ref,
  setCreditTotal,
  setNewCreditsToCreate,
  setCreditsToUpdate,
  setRoute: setR,
  invoice,
}: props) {
  const routes = [
    {
      name: "Seleccione una",
      value: "",
      disabled: true,
      selected: true,
    },
    {
      name: "Ruta 1",
      value: "1",
    },
    {
      name: "Ruta 2",
      value: "2",
    },
    {
      name: "Ruta 3",
      value: "3",
    },
    {
      name: "Ruta 4",
      value: "4",
    },
    {
      name: "Ruta 5",
      value: "5",
    },
    {
      name: "Ruta 6",
      value: "6",
    },
  ];
  const [credits, setCredits] = useState<QuerySnapshot<clientCredit>>();
  const [route, setRoute] = useState<number | undefined>(undefined);
  const [newCredits, setNewCredits] = useState<Record<string, newCredits>>({});
  const [allDiffs, setAllDiffs] = useState<allDiffs>({});
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!route) return;
    //{ clientName, address, amount }
    const target = e.target as typeof e.target & {
      clientName: HTMLInputElement;
      address: HTMLTextAreaElement;
      amount: HTMLInputElement;
    };

    const clientName = target.clientName.value;
    const address = target.address.value;
    const amount = target.amount.value;

    setNewCredits((props) => {
      return {
        ...props,
        [clientName]: {
          route,
          name: clientName,
          amount: Number(amount),
          address: address,
        },
      };
    });

    setAllDiffs((props) => {
      return {
        ...props,
        [clientName]: -Number(amount),
      };
    });

    // await createClientCredit(
    //   route,
    //   seller_ref,
    //   clientName.value,
    //   Number(amount.value),
    //   address.value
    // );

    formRef.current?.reset();
  }

  // effect to get the credits
  useEffect(() => {
    async function credits() {
      if (!refresh) return;
      if (!route) return;

      const credits = await getCredits(route, seller_ref);

      setCredits(credits);
      setRefresh(false);
    }

    credits();
  }, [refresh, route, seller_ref]);

  // effect to manage the credit diff
  useEffect(() => {
    const values = Object.values(allDiffs);

    const total: number = values.reduce((before: number, now): number => {
      if (typeof now === "number") {
        return before + now;
      } else return before + now.amount;
    }, 0);

    setTotal(total);
    setCreditTotal(total);
  }, [allDiffs, setCreditTotal]);

  // effecto to return the new credits to create
  useEffect(() => {
    setNewCreditsToCreate(Object.values(newCredits));
  }, [newCredits, setNewCreditsToCreate]);

  // effecto to return the new credits to update
  useEffect(() => {
    const values = Object.values(allDiffs);
    const correct = values.filter((el) => typeof el !== "number");

    setCreditsToUpdate(correct);
  }, [allDiffs, setCreditsToUpdate]);

  // ----------------- effects to manage the edit mode
  // effect to set the route
  useEffect(() => {
    const route = invoice?.data()?.route;
    if (route) {
      setRoute(route);
      setR(route);
    }
  }, [invoice, setR]);

  return (
    <Container>
      <h2>Creditos</h2>
      <Select
        options={routes.map((el) => {
          return {
            ...el,
            selected: Number(el.value) === invoice?.data()?.route,
          };
        })}
        onChange={(e) => {
          setRoute(Number(e.target.value));
          setR(Number(e.target.value));
          setRefresh(true);
        }}
      >
        ¿De que ruta son estos creditos?
      </Select>
      {!route ? (
        <h3>Seleccione una ruta para empezar</h3>
      ) : (
        <FlexContainer>
          <Form
            ref={formRef}
            onSubmit={onSubmit}
            style={{
              marginRight: "20px",
              display: "inline-block",
              position: "sticky",
              top: "0px",
            }}
          >
            <h3>Crear credito</h3>
            <p>Formulario para agregar un nuevo credito</p>
            <FlexContainer>
              <InputText
                name="clientName"
                style={{ marginRight: "20px" }}
                required
              >
                Nombre
              </InputText>
              <InputNumber name="amount" width="200px" required>
                Cantidad
              </InputNumber>
            </FlexContainer>
            <p>Dirección</p>
            <textarea
              name="address"
              style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
            />
            <Button>Agregar</Button>
          </Form>
          <Container>
            <FlexContainer
              styles={{ width: "525px", justifyContent: "space-between" }}
            >
              <h3>Creditos</h3>
              <p>Anterior/nuevo/diferencia</p>
            </FlexContainer>
            {Object.values(newCredits).length > 0 && (
              <Container styles={{ marginBottom: "10px" }}>
                <h4>Nuevos creditos</h4>
                {Object.values(newCredits).map((el, i) => (
                  <NewClientCredit
                    credit={el}
                    key={i}
                    setNewCredits={setNewCredits}
                    setAllDiffs={setAllDiffs}
                  />
                ))}
              </Container>
            )}
            {!credits || credits.size === 0 ? (
              <p>No hay creditos actualmente</p>
            ) : (
              <Container styles={{ marginBottom: "10px" }}>
                <h4>Creditos anteriores</h4>
                {credits?.docs.map((_, i) => {
                  const creditToEdit = invoice
                    ?.data()
                    ?.newCredits?.find((el) => {
                      return el.parent.parent?.id === _.id;
                    });

                  return (
                    <ClientCredit
                      creditToEditRef={creditToEdit}
                      client={_}
                      setAllDiffs={setAllDiffs}
                      key={i}
                    />
                  );
                })}
              </Container>
            )}
            <FlexContainer styles={{ justifyContent: "flex-end" }}>
              <FlexContainer>
                <Container
                  styles={{
                    width: "75px",
                    marginRight: "10px",
                    textAlign: "center",
                  }}
                >
                  <h4>Total</h4>
                </Container>
                <Container styles={{ width: "75px", textAlign: "center" }}>
                  {numberParser(total)}
                </Container>
              </FlexContainer>
            </FlexContainer>
          </Container>
        </FlexContainer>
      )}
    </Container>
  );
}

type awdfawf = {
  client: QueryDocumentSnapshot<clientCredit>;
  setAllDiffs: Dispatch<SetStateAction<allDiffs>>;
  creditToEditRef: DocumentReference<credit> | undefined;
};

function ClientCredit({ client, setAllDiffs, creditToEditRef }: awdfawf) {
  const data = useMemo(() => client.data(), [client]);
  const [credit, setCredit] = useState<QueryDocumentSnapshot<credit>>();
  const creditData = useMemo(() => credit?.data(), [credit]);
  const [diff, setDiff] = useState<number | string>("...");
  const [editAmount, setEditAmount] = useState(false);
  const [creditToEdit, setCreditToEdit] = useState<DocumentSnapshot<credit>>();

  const manageDiff = useCallback(
    (e: ChangeEvent<HTMLInputElement> | number) => {
      if (!creditData) return;

      const value = typeof e === "number" ? e : Number(e.target.value);
      const previusAmount = creditData.last_amount;
      const currentAmount = creditData.amount;
      const wowowow = creditToEdit ? previusAmount : currentAmount;
      const different = wowowow - value;

      setDiff(different);

      setAllDiffs((props) => {
        return {
          ...props,
          [client.id]: {
            newAmount: value,
            amount: different,
            ref: client.ref,
            previuss: creditToEdit?.ref,
          },
        };
      });
    },
    [client.id, client.ref, creditData, creditToEdit, setAllDiffs]
  );

  // effecto get the credit
  useEffect(() => {
    async function getCredit() {
      const credit = await getClientCredits(client);

      setCredit(credit);
    }

    getCredit();
  }, [client]);

  // effect to get the credits to edit
  useEffect(() => {
    async function getCreditToEdit() {
      if (!creditToEditRef) return;
      const credit = await getDoc(creditToEditRef);

      setCreditToEdit(credit);
    }

    getCreditToEdit();
  }, [creditToEditRef]);

  // effecto to update the diff
  useEffect(() => {
    if (!creditToEdit || typeof diff === "number") return;

    const previusAmount = creditToEdit.data()?.amount as number;

    manageDiff(previusAmount);
  }, [creditToEdit, manageDiff, diff]);

  if (!creditData) return <>Cargando...</>;

  return (
    <FlexContainer
      styles={{
        borderBottom: "1px solid " + globalCSSVars["--detail"],
        alignItems: "center",
      }}
    >
      <Container styles={{ width: "300px", marginRight: "10px" }}>
        <p style={{ marginBottom: "0px" }}>{data.name}</p>
        <small>{data.address}</small>
      </Container>
      <FlexContainer styles={{ height: "100%" }}>
        <Container
          styles={{ width: "75px", marginRight: "10px", textAlign: "center" }}
        >
          {!creditToEdit
            ? numberParser(creditData.amount)
            : creditToEdit.data()?.last_amount
            ? //@ts-ignore
              numberParser(creditToEdit.data()?.last_amount)
            : "Nuevo"}
        </Container>
        <Container
          styles={{ width: "75px", marginRight: "10px", height: "100%" }}
        >
          <Input
            onChange={manageDiff}
            onClick={() => setEditAmount(true)}
            onSelect={() => setEditAmount(true)}
            value={!editAmount ? creditToEdit?.data()?.amount : undefined}
            height="100%"
            type="number"
            style={{ textAlign: "center" }}
          />
        </Container>
        <Container
          styles={{ width: "75px", height: "100%", textAlign: "center" }}
        >
          {diff}
        </Container>
      </FlexContainer>
    </FlexContainer>
  );
}

function NewClientCredit({
  credit,
  setNewCredits,
  setAllDiffs,
}: {
  credit: newCredits;
  setNewCredits: Dispatch<SetStateAction<Record<string, newCredits>>>;
  setAllDiffs: Dispatch<SetStateAction<allDiffs>>;
}) {
  function remove() {
    setNewCredits((props) => {
      const all = { ...props };

      delete all[credit.name];

      return { ...all };
    });

    setAllDiffs((props) => {
      const all = { ...props };

      delete all[credit.name];

      return { ...all };
    });
  }

  return (
    <FlexContainer
      styles={{
        borderBottom: "1px solid " + globalCSSVars["--detail"],
        alignItems: "center",
      }}
    >
      <Container styles={{ width: "300px", marginRight: "10px" }}>
        <p style={{ marginBottom: "0px" }}>{credit.name}</p>
        <small>{credit.address}</small>
      </Container>
      <FlexContainer>
        <Container styles={{ width: "75px", marginRight: "10px" }} />
        <Container
          styles={{ width: "75px", marginRight: "10px", textAlign: "center" }}
        >
          -{numberParser(credit.amount)}
        </Container>
        <Container styles={{ width: "75px", textAlign: "center" }}>
          <Button style={{ border: "none", padding: "0" }} onClick={remove}>
            Quitar
          </Button>
        </Container>
      </FlexContainer>
    </FlexContainer>
  );
}
