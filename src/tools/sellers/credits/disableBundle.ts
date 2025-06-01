import { DocumentReference, runTransaction } from "firebase/firestore";
import { creditBundle } from "./createBundle";
import { Firestore } from "@/tools/firestore";

interface props {
  bundle_ref: DocumentReference<creditBundle>;
}

/**
 * Deshabilita un paquete de créditos (bundle) y actualiza los punteros de la lista enlazada
 * (last_bundle, next_bundle) de sus paquetes vecinos dentro de una transacción de Firestore.
 *
 * Estructura asumida para `creditBundle` (de ./createBundle.ts):
 * interface creditBundle {
 *   // ... otros campos
 *   disabled: boolean; // Campo para marcar el bundle como deshabilitado. Podría ser también un campo 'status'.
 *   last_bundle: DocumentReference<creditBundle> | null;
 *   next_bundle: DocumentReference<creditBundle> | null;
 * }
 */
export async function disableBundle({ bundle_ref }: props): Promise<void> {
  const db = Firestore();
  // La instancia 'db' (Firestore) es requerida para runTransaction.
  // Se asume que está importada desde la ruta especificada arriba.

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener el bundle a deshabilitar usando el método get de la transacción.
      // El tipo <creditBundle> en DocumentReference asegura que snap.data() esté tipado.
      const bundleToDisableSnap = await transaction.get(bundle_ref);

      if (!bundleToDisableSnap.exists()) {
        // Si el documento del bundle no existe, lanzar un error.
        throw new Error(`El bundle con ID ${bundle_ref.id} no existe.`);
      }

      const bundleToDisableData = bundleToDisableSnap.data();
      // Esta comprobación es principalmente por seguridad de tipos si data() pudiera devolver undefined
      // aunque exists() sea true. Con los tipos del SDK de Firestore, si exists() es true, data() debería devolver T.
      if (!bundleToDisableData) {
        throw new Error(
          `Faltan datos para el bundle ${bundle_ref.id}, aunque el documento existe.`
        );
      }

      // 2. Comprobar si el bundle ya está deshabilitado.
      if (bundleToDisableData.disabled === true) {
        console.warn(
          `El bundle ${bundle_ref.id} ya está deshabilitado. No se realiza ninguna acción.`
        );
        return; // Salir de la transacción tempranamente ya que no se necesitan cambios.
      }

      // Obtener referencias a los bundles anterior y siguiente.
      const prevBundleRef = bundleToDisableData.last_bundle; // Esperado: DocumentReference<creditBundle> | null
      const nextBundleRef = bundleToDisableData.next_bundle; // Esperado: DocumentReference<creditBundle> | null

      // 3. Marcar el bundle actual como deshabilitado.
      transaction.update(bundle_ref, { disabled: true });

      // 4. Actualizar la referencia 'next_bundle' del bundle anterior.
      // Si existe un bundle anterior, su 'next_bundle' ahora debe apuntar
      // al 'next_bundle' del bundle que se está deshabilitando (que podría ser null).
      if (prevBundleRef) {
        transaction.update(prevBundleRef, { next_bundle: nextBundleRef });
      }

      // 5. Actualizar la referencia 'last_bundle' del bundle siguiente.
      // Si existe un bundle siguiente, su 'last_bundle' ahora debe apuntar
      // al 'last_bundle' del bundle que se está deshabilitando (que podría ser null).
      if (nextBundleRef) {
        transaction.update(nextBundleRef, { last_bundle: prevBundleRef });
      }
    });

    console.log(
      `El bundle ${bundle_ref.id} fue deshabilitado exitosamente y los bundles enlazados actualizados.`
    );
  } catch (error) {
    console.error(
      `Falló la deshabilitación del bundle ${bundle_ref.id}. Error:`,
      error
    );
    // Re-lanzar el error para permitir una gestión de errores de más alto nivel o logging.
    // Considera un manejo de errores específico o devolver un objeto de estado según las necesidades de la aplicación.
    throw error;
  }
}
