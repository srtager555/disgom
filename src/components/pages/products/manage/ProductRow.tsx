import { GridContainer, FlexContainer } from "@/styles/index.styles";
import { entryDoc } from "@/tools/products/addEntry";
import { outputType } from "@/tools/products/addOutputs";
import { productDoc } from "@/tools/products/create";
import {
  collection,
  CollectionReference,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useState, Dispatch, SetStateAction, useEffect } from "react";
import { Column } from "../../invoice/Product";
import { InputToEntries } from "./InputToEntries";
import { getCurrentWeekRange } from "@/tools/time/current";

const grid = "225px repeat(8, 150px)";
const FlexStartStyles = {
  width: "100%",
  height: "100%",
  justifyContent: "flex-start",
  alignItems: "center",
};

function HelperGetEntriesOrOutputs(
  product: QueryDocumentSnapshot<productDoc>,
  path: "entry" | "output",
  onSnapshotCallback: (snapshot: QuerySnapshot<outputType | entryDoc>) => void
) {
  const range = getCurrentWeekRange();
  const weekRange = [
    where("created_at", ">=", range.start),
    where("created_at", "<=", range.end),
    where("disabled", "==", false),
  ];
  const coll1 = collection(
    product.ref,
    "entry"
  ) as CollectionReference<entryDoc>;
  const coll2 = collection(
    product.ref,
    "output"
  ) as CollectionReference<outputType>;

  let q;

  if (path === "entry") q = query(coll1, ...weekRange);
  else q = query(coll2, ...weekRange, orderBy("created_at", "desc"));

  return onSnapshot(q, onSnapshotCallback);
}

type entryObject = Record<string, Array<QueryDocumentSnapshot<entryDoc>>>;
type outputObject = Record<string, Array<QueryDocumentSnapshot<outputType>>>;

type props = {
  product: QueryDocumentSnapshot<productDoc>;
};

export function ProductRow({ product }: props) {
  const productName = product.data().name;
  const [entries, setEntries] = useState<entryObject>({});
  const [outputs, setOutputs] = useState<outputObject>({});
  const weekNumber = [0, 1, 2, 3, 4, 5, 6];

  // 1. Hacer la función genérica con un tipo T que puede ser entryDoc o outputType
  function handlerSnapshot<T extends entryDoc | outputType>(
    // 2. Usar el tipo genérico T para definir el tipo esperado por setState
    setState: Dispatch<
      SetStateAction<Record<string, Array<QueryDocumentSnapshot<T>>>>
    >
  ) {
    // 3. El callback ahora recibe un snapshot del tipo T
    return (snapshot: QuerySnapshot<T>) => {
      // 4. Castear los documentos al tipo genérico T
      const typedDocs = snapshot.docs as QueryDocumentSnapshot<T>[];
      // 5. El objeto agrupado también usará el tipo genérico T
      const groupedData: Record<string, Array<QueryDocumentSnapshot<T>>> = {};

      typedDocs.forEach((doc) => {
        const timestamp = doc.data().created_at; // created_at debe existir en ambos tipos
        // Formatea la fecha como 'YYYY-MM-DD' para usarla como clave
        const dateString = timestamp.toDate().toISOString().split("T")[0];

        if (!groupedData[dateString]) {
          groupedData[dateString] = [];
        }
        groupedData[dateString].push(doc);

        // Opcional: Ordenar las entradas dentro de cada día si es necesario
        // (la query ya ordena, pero esto asegura el orden dentro del grupo)
        groupedData[dateString].sort(
          (a, b) =>
            a.data().created_at.toMillis() - b.data().created_at.toMillis()
        );
      });

      // 6. Llamar a setState con el objeto agrupado correctamente tipado
      setState(groupedData);
    };
  }

  // effect to get the entries
  useEffect(() => {
    const unsubscribe = HelperGetEntriesOrOutputs(
      product,
      "entry",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      handlerSnapshot(setEntries)
    );

    return unsubscribe;
  }, [product]);

  // effect to get the outputs
  useEffect(() => {
    const unsubscribe = HelperGetEntriesOrOutputs(
      product,
      "output", // Corregido de "entry" a "output"

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      handlerSnapshot(setOutputs)
    );

    return unsubscribe;
  }, [product]);

  useEffect(() => {
    console.log(entries, outputs);
  }, [entries, outputs]);

  return (
    <GridContainer $gridTemplateColumns={grid} $width="1430px">
      <Column styles={{ position: "sticky", left: "0", zIndex: "1" }}>
        <FlexContainer styles={FlexStartStyles}>
          <span>{productName}</span>
        </FlexContainer>
      </Column>
      {weekNumber.map((dayIndex) => {
        const entriesForDay =
          Object.entries(entries).find(
            (el) => new Date(el[0]).getDay() === dayIndex
          )?.[1] ?? [];
        const outputsForDay =
          Object.entries(outputs).find(
            (el) => new Date(el[0]).getDay() === dayIndex
          )?.[1] ?? [];

        const outputsReduced = outputsForDay.reduce(
          (acc, next) => acc + next.data().amount,
          0
        );

        return (
          <Column key={dayIndex}>
            <GridContainer $gridTemplateColumns="1fr 1fr" $isChildren>
              <InputToEntries product={product} entriesForDay={entriesForDay} />
              <Column>{outputsReduced}</Column>
            </GridContainer>
          </Column>
        );
      })}
      <Column></Column>
    </GridContainer>
  );
}
