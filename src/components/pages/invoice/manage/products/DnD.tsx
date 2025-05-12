import React, { useRef } from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { ItemTypes } from "@/ItemTypes";
import { MemoProduct } from "./Product"; // Tu MemoProduct
import { QueryDocumentSnapshot, DocumentReference } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";

// Props que MemoProduct espera, excluyendo 'doc' ya que lo manejaremos como 'product' aquí.
// Asumimos que las props de MemoProduct son las mismas que las de Product.
import { type props as ProductComponentProps } from "./Product";

export interface DnDWrapperProps extends Omit<ProductComponentProps, "doc"> {
  product: QueryDocumentSnapshot<productDoc>;
  index: number;
  moveProduct: (dragIndex: number, hoverIndex: number) => void;
  saveOrderToFirestore: () => void;
}

// Interfaz para el objeto que se arrastra
interface DragItem {
  id: string;
  index: number;
  productRef: DocumentReference<productDoc>;
  type: string;
}

export const DnDWrapper: React.FC<DnDWrapperProps> = ({
  product,
  index,
  moveProduct,
  saveOrderToFirestore,
  ...memoProductProps // El resto de las props para MemoProduct
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    { droppedOnProductId: string },
    { handlerId: string | symbol | null }
  >({
    accept: ItemTypes.PRODUCT,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveProduct(dragIndex, hoverIndex);
      item.index = hoverIndex; // ¡Muy importante! Actualiza el índice del ítem arrastrado
    },
    drop: () => ({ droppedOnProductId: product.id }), // Necesario para que monitor.didDrop() funcione
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.PRODUCT,
    item: () => ({
      id: product.id,
      index,
      productRef: product.ref,
      type: ItemTypes.PRODUCT,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        saveOrderToFirestore();
      }
    },
  });

  // Conectar los refs al div
  preview(drop(ref));
  // Si quieres que solo el GrabButton sea el handle, pasarías 'drag' a MemoProduct y lo conectarías allí.
  // Por ahora, todo el elemento es arrastrable.
  drag(ref); // Hace que el elemento completo sea el origen del arrastre

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: "move" }}
      data-handler-id={handlerId}
    >
      <MemoProduct doc={product} {...memoProductProps} />
    </div>
  );
};
