import { HideWithoutStock } from "@/components/pages/products/HideWithoutStock";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Container, FlexContainer } from "@/styles/index.styles";
import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Descriptions, productResult } from "../../ProductList";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot, writeBatch } from "firebase/firestore";
import { Button } from "@/styles/Form.styles";
import { useGetAllInventory } from "@/hooks/invoice/getAllInventory";
import { useInvoice } from "@/contexts/InvoiceContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { productDoc } from "@/tools/products/create";
import { Firestore } from "@/tools/firestore";
import { DnDWrapper } from "./DnD";

type props = {
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
};

export function Products({ selectedSeller, setProductsResults }: props) {
  const { invoice } = useInvoice();
  // `useGetProducts` ya no usa tags. Asumimos que podría depender implícitamente
  // del `selectedSeller` o de algún otro contexto para filtrar, o simplemente trae todos.
  // Es importante que traiga los productos ordenados por 'position' para la carga inicial.
  // Asegúrate de que esta llamada a useGetProducts sea la correcta.
  // Si espera un objeto de opciones, sería: useGetProducts({ orderBy: "position", orderDirection: "asc" });
  // Si no toma argumentos y siempre ordena por posición, sería: useGetProducts();
  const productsQuery = useGetProducts("position", "asc"); // Revisa esta línea según la definición de tu hook.
  const [hideProductWithoutStock, setHideProductWithoutStock] = useState(false);
  const allInventory = useGetAllInventory(
    invoice?.data()?.last_inventory_ref || undefined
  );

  const [displayedProducts, setDisplayedProducts] = useState<
    QueryDocumentSnapshot<productDoc>[]
  >([]);
  const [currentSort, setCurrentSort] = useState<"position" | "name">(
    "position"
  );
  // Ref para controlar la carga inicial o el cambio de contexto (ej. cambio de vendedor)
  const loadedSellerIdRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    const currentSellerId = selectedSeller?.id;

    // Caso 1: El vendedor ha cambiado. Siempre actualiza desde productsQuery.
    if (loadedSellerIdRef.current !== currentSellerId) {
      if (productsQuery?.docs) {
        setDisplayedProducts(productsQuery.docs);
      } else {
        setDisplayedProducts([]); // Limpiar si no hay documentos para el nuevo vendedor
      }
      loadedSellerIdRef.current = currentSellerId;
    }
    // Caso 2: El vendedor es el mismo, displayedProducts está vacío y productsQuery ahora tiene datos.
    // Esto maneja la carga inicial para un vendedor si productsQuery estaba inicialmente vacío/nulo.
    else if (
      displayedProducts.length === 0 &&
      productsQuery?.docs &&
      productsQuery.docs.length > 0
    ) {
      setDisplayedProducts(productsQuery.docs);
    }
  }, [productsQuery, selectedSeller, displayedProducts.length]); // Añadido displayedProducts.length a las dependencias

  const moveProduct = useCallback((dragIndex: number, hoverIndex: number) => {
    setDisplayedProducts((prevProducts) => {
      const newProducts = [...prevProducts];
      const [draggedItem] = newProducts.splice(dragIndex, 1);
      newProducts.splice(hoverIndex, 0, draggedItem);
      return newProducts;
    });
  }, []);

  const saveOrderToFirestore = useCallback(async () => {
    const db = Firestore();
    const batch = writeBatch(db);
    const productsToSave = [...displayedProducts]; // Usar una copia del estado actual

    productsToSave.forEach((productDoc, index) => {
      batch.update(productDoc.ref, { position: index });
    });

    try {
      await batch.commit();
      console.log("Product order saved to Firestore.");
    } catch (error) {
      console.error("Error saving product order:", error);
    }
  }, [displayedProducts]);

  const toggleSort = () => {
    setCurrentSort((prevSort) =>
      prevSort === "position" ? "name" : "position"
    );
  };

  const productsToRender = useMemo(() => {
    if (currentSort === "name") {
      // Crea una copia de displayedProducts y la ordena por nombre para la visualización
      return [...displayedProducts].sort((a, b) => {
        const nameA = a.data()?.name?.toLowerCase() || "";
        const nameB = b.data()?.name?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      });
    }
    // Si el orden es por 'position', displayedProducts ya tiene el orden correcto (o el que se está arrastrando)
    return displayedProducts;
  }, [displayedProducts, currentSort]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Container styles={{ marginTop: "20px" }}>
        <FlexContainer
          styles={{ marginBottom: "20px", gap: "10px", alignItems: "center" }}
        >
          {/* SelectTag ha sido removido */}
          <Container>
            <HideWithoutStock
              setHideProductWithoutStock={setHideProductWithoutStock}
              hideProductWithoutStock={hideProductWithoutStock}
            />
          </Container>
          <Button onClick={toggleSort}>
            Ordenardo por {currentSort === "position" ? "Posición" : "Nombre"}
          </Button>
          <Button
            onClick={() => {
              window.print();
            }}
          >
            Imprimir
          </Button>
        </FlexContainer>
        <Container>
          <Descriptions hasInventory={selectedSeller?.data().hasInventory} />
          {productsToRender.map((productDoc) => {
            // Es crucial obtener el índice del producto desde `displayedProducts`
            // ya que esta es la lista que `moveProduct` y `saveOrderToFirestore` manipulan.
            const dndIndex = displayedProducts.findIndex(
              (p) => p.id === productDoc.id
            );

            // Esto no debería ocurrir si productsToRender se deriva correctamente de displayedProducts
            if (dndIndex === -1) return null;

            return (
              <DnDWrapper
                key={productDoc.id}
                product={productDoc}
                index={dndIndex}
                moveProduct={moveProduct}
                saveOrderToFirestore={saveOrderToFirestore}
                selectedSeller={selectedSeller}
                hideProductWithoutStock={hideProductWithoutStock}
                allInventory={allInventory}
                setProductsResults={setProductsResults}
              />
            );
          })}
        </Container>
      </Container>
    </DndProvider>
  );
}
