import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "@/components/pages/invoice/Product";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { useGetProducts } from "@/hooks/products/getProducts";

// Importa tipos y funciones necesarios de Firestore y React
import {
  QueryDocumentSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  // where,
  // doc, // 'doc' no se usa directamente aquí ahora
  DocumentData,
  DocumentReference,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import { useMemo, useState, useEffect } from "react";
import { Firestore } from "@/tools/firestore"; // Asegúrate que la importación sea correcta
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping"; // Importar constantes
import { numberParser } from "@/tools/numberPaser"; // Importar para formatear el total
import { isEqual } from "lodash";
import { Button } from "@/styles/Form.styles";

// Ajustamos el grid para añadir 3 columnas más para los totales (ancho estimado)
const gridTemplate =
  "65px 175px repeat(auto-fit, minmax(65px, 1fr))  75px 75px 90px";

// Tipo para almacenar los productos del inventario de un vendedor
type SellerInventoryProduct = {
  // Asume que tienes estos campos, ajusta según tu estructura real
  product_ref: DocumentReference<DocumentData>;
  amount: number;
  // ... otros campos si los necesitas
};

export default function Page() {
  const [order, setOrder] = useState<keyof productDoc>("position");
  const [orderByName, setOrderByName] = useState(false);
  const products = useGetProducts(order);
  const sellers = useGetSellers(); // Obtener vendedores aquí

  // Filtrar y ordenar vendedores una sola vez
  const activeSellers = useMemo(() => {
    return (
      sellers?.docs
        .filter((el) => el.data().hasInventory)
        .sort((a, b) => a.data().name.localeCompare(b.data().name)) ?? []
    ); // Manejar caso undefined
  }, [sellers]);

  // Estado para almacenar TODOS los productos de los últimos inventarios de los vendedores activos
  const [allSellerInventories, setAllSellerInventories] = useState<
    Record<string, SellerInventoryProduct[]>
  >({});
  const [loadingInventories, setLoadingInventories] = useState(true);

  function handlerOnClick() {
    if (!orderByName) {
      setOrder("name");
      setOrderByName(true);
    } else {
      setOrder("position");
      setOrderByName(false);
    }
  }

  useEffect(() => {
    const fetchAllInventories = async () => {
      const db = Firestore(); // Obtener instancia de Firestore (cliente)

      if (!db || activeSellers.length === 0) {
        setLoadingInventories(false);
        return;
      }

      setLoadingInventories(true);
      const inventoriesData: Record<string, SellerInventoryProduct[]> = {};

      // Usamos Promise.all para buscar los inventarios en paralelo
      await Promise.all(
        activeSellers.map(async (seller) => {
          const sellerId = seller.id;
          try {
            // 1. First create the invoice coll
            const coll = collection(db, InvoiceCollection.root);

            // 2. The query must obtain the seller's latest invoice.
            const q = query(
              coll,
              where("seller_ref", "==", seller.ref),
              where("disabled", "==", false),
              limit(1),
              orderBy("created_at", "desc")
            );
            const lastedInvoiceQuery = await getDocs(q);

            if (!lastedInvoiceQuery.empty) {
              const lastedInvoice = lastedInvoiceQuery.docs[0];
              // 3. Referencia a la subcolección 'products' del último inventario
              const inventoryColl = collection(
                lastedInvoice.ref,
                InvoiceCollection.inventory
              );
              const q = query(inventoryColl, where("disabled", "==", false));

              // 4. Obtener TODOS los productos de esa subcolección
              const productsSnapshot = await getDocs(q);

              // 5. Mapear los documentos a nuestro tipo SellerInventoryProduct
              inventoriesData[sellerId] = productsSnapshot.docs.map((doc) => ({
                // Asegúrate que los nombres de campo 'product_ref' y 'quantity' sean correctos
                product_ref: doc.data()
                  .product_ref as DocumentReference<DocumentData>,
                amount: (doc.data().amount as number) || 0,
              }));
            } else {
              console.log("vacio");
              inventoriesData[sellerId] = []; // Vendedor sin inventario registrado
            }
          } catch (error) {
            console.error(
              `Error fetching inventory for seller ${sellerId}:`,
              error
            );
            inventoriesData[sellerId] = []; // Dejar vacío en caso de error
          }
        })
      );

      setAllSellerInventories(inventoriesData);
      setLoadingInventories(false);
    };

    fetchAllInventories();
  }, [activeSellers]); // Depende de la instancia de DB y los vendedores activos

  // --- Cálculo del Gran Total ---
  const grandTotal = useMemo(() => {
    // No calcular si los inventarios aún están cargando o no hay productos
    if (loadingInventories || !products.docs) {
      return null;
    }

    let totalValue = 0;

    products.docs.forEach((product) => {
      const productRef = product.ref;
      let totalStockForProduct = 0;

      // Calcular el stock total para este producto (similar a ProductInventory)
      activeSellers.forEach((seller) => {
        const sellerInventory = allSellerInventories[seller.id] || [];
        const stock = sellerInventory
          .filter(
            (item) => item.product_ref && isEqual(item.product_ref, productRef)
          )
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        totalStockForProduct += stock;
      });

      // Calcular el valor para este producto
      // ¡¡VERIFICA ESTA RUTA!! product.data().stock?.[0]?.sale_price
      const price = product.data().stock?.[0]?.sale_price ?? 0;
      totalValue += totalStockForProduct * price;
    });

    return totalValue;
    // Dependencias: se recalcula si cambian los productos, los vendedores, los inventarios o el estado de carga
  }, [loadingInventories, products.docs, activeSellers, allSellerInventories]);

  return (
    <FlexContainer
      styles={{ justifyContent: "center", flexDirection: "column" }}
    >
      <h1 style={{ textAlign: "center" }}>Inventarios de los vendedores</h1>
      <Container>
        <Button onClick={handlerOnClick}>
          Ordenado por {orderByName ? "Nombre" : "Posición"}
        </Button>
        <Container styles={{ marginTop: "10px" }}>
          <DescriptionWithSellers sellers={activeSellers} />{" "}
          {/* Pasar vendedores */}
          {products.docs?.map((product) => (
            // Pasar también los inventarios cargados y el estado de carga
            <ProductInventory
              key={product.id}
              product={product}
              sellers={activeSellers}
              allSellerInventories={allSellerInventories}
              loadingInventories={loadingInventories} // Pasar estado de carga global
            />
          ))}
        </Container>
      </Container>
      {/* Mostrar el Gran Total */}
      <Container
        styles={{ marginTop: "20px", maxWidth: "80%", alignSelf: "center" }}
      >
        <GridContainer
          $gridTemplateColumns={gridTemplate}
          styles={{ borderTop: "2px solid grey", paddingTop: "10px" }}
        >
          {/* Columnas vacías para alinear con la tabla */}
          <Column gridColumn={`span ${2 + activeSellers.length + 1 + 1}`}>
            {" "}
            {/* 2 (Inv, Prod) + N sellers + Total Stock + Precio U. */}
            <strong style={{ float: "right" }}>TOTAL LPS</strong>
          </Column>
          <Column $textAlign="center">
            <strong>
              {loadingInventories
                ? "Calculando..."
                : `${numberParser(grandTotal ?? 0)}`}
            </strong>
          </Column>
        </GridContainer>
      </Container>
      <div style={{ height: "50px" }} />
    </FlexContainer>
  );
}

type DescriptionProps = {
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>; // Recibe vendedores como prop
};

const DescriptionWithSellers = ({ sellers }: DescriptionProps) => {
  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column>INV</Column>
      <Column gridColumn="span 2">PRODUCTOS</Column>
      {sellers.map(
        (
          seller // Usar la lista de props
        ) => (
          <Column
            $textAlign="center"
            key={seller.id}
            title={seller.data().name}
          >
            {seller.data().name}
          </Column>
        )
      )}
      {/* Nuevas Cabeceras */}
      <Column gridColumn="-3 / -4" $textAlign="center">
        TOTAL
      </Column>
      <Column gridColumn="-2 / -3" $textAlign="center">
        PRECIO
      </Column>
      <Column gridColumn="-1 / -2" $textAlign="center">
        VALOR
      </Column>
    </GridContainer>
  );
};

type props = {
  product: QueryDocumentSnapshot<productDoc>; // Recibe el producto completo
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>; // Recibe los vendedores activos
  allSellerInventories: Record<string, SellerInventoryProduct[]>; // Recibe TODOS los inventarios
  loadingInventories: boolean; // Recibe el estado de carga global
};

const ProductInventory = ({
  product,
  sellers,
  allSellerInventories,
  loadingInventories,
}: props) => {
  // const productId = product.id;
  const productName = product.data().name;
  const productRef = product.ref; // Referencia completa al documento del producto
  const currentInv = useMemo(() => {
    const stock = product.data().stock;
    return stock.reduce((acc, item) => acc + item.amount, 0);
  }, [product]);

  // Función para calcular el stock de un vendedor para ESTE producto (memoizada)
  const getStockForSeller = useMemo(
    () =>
      (sellerId: string): number => {
        // Obtener los productos del inventario de este vendedor desde la prop
        const sellerInventory = allSellerInventories[sellerId] || [];

        // Filtrar los productos que coinciden con la referencia del producto actual
        // y sumar sus cantidades
        const stock = sellerInventory
          .filter(
            (item) => item.product_ref && isEqual(item.product_ref, productRef)
          ) // Comprobar igualdad de referencias
          .reduce((sum, item) => sum + (item.amount || 0), 0); // Sumar cantidades

        return stock;
        // Dependencia: recalcular si cambian los inventarios o la referencia del producto actual
      },
    [allSellerInventories, productRef]
  );

  // --- Cálculos para los totales de esta fila (producto) ---
  const { totalStock, precioUnitario, valorProducto } = useMemo(() => {
    if (loadingInventories) {
      // Si está cargando, devolver valores placeholder o null
      return { totalStock: null, precioUnitario: null, valorProducto: null };
    }
    // Calcular stock total sumando el de cada vendedor activo
    const currentTotalStock = sellers.reduce(
      (sum, seller) => sum + getStockForSeller(seller.id),
      0
    );
    // Obtener precio (¡¡VERIFICA ESTA RUTA!!) product.data().stock?.[0]?.sale_price
    const currentPrecio = product.data().stock?.[0]?.sale_price ?? 0;
    const currentValor = currentTotalStock * currentPrecio;

    return {
      totalStock: currentTotalStock,
      precioUnitario: currentPrecio,
      valorProducto: currentValor,
    };
  }, [loadingInventories, sellers, getStockForSeller, product]); // Dependencias del cálculo

  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column title={numberParser(currentInv)}>
        {numberParser(currentInv)}
      </Column>
      <Column gridColumn="span 2">{productName}</Column>
      {/* Iterar sobre los vendedores activos */}
      {sellers.map((seller) => (
        <Column key={seller.id} $textAlign="center">
          {/* Mostrar '...' si los inventarios globales están cargando, sino calcular y mostrar */}
          {loadingInventories ? (
            "..."
          ) : (
            <span
              style={getStockForSeller(seller.id) === 0 ? { opacity: 0.5 } : {}}
            >
              {getStockForSeller(seller.id)}
            </span>
          )}
        </Column>
      ))}
      {/* Columnas con los Totales */}
      <Column gridColumn="-3 / -4" $textAlign="center">
        {loadingInventories ? "..." : totalStock}
      </Column>
      <Column gridColumn="-2 / -3" $textAlign="center">
        {/* Formatear precio como moneda */}
        {loadingInventories ? "..." : numberParser(precioUnitario ?? 0)}
      </Column>
      <Column gridColumn="-1 / -2" $textAlign="center">
        {/* Formatear valor como moneda */}
        {loadingInventories ? "..." : numberParser(valorProducto ?? 0)}
      </Column>
    </GridContainer>
  );
};
