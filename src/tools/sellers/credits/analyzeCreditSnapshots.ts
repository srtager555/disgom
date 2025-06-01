import { QueryDocumentSnapshot } from "firebase/firestore";
import { CreditInBundle } from "./createOrUpdateCreditInBundle";
import { client as ClientDocType } from "../createClient"; // Asegúrate que la ruta sea correcta

// Define la estructura para los ítems en credits_list
export interface AnalyzedCreditItem {
  client: QueryDocumentSnapshot<ClientDocType>; // El documento del cliente
  last_credit: number | null;
  current_credit: number | null;
  difference: number;
}

// Define la estructura para el objeto de resultado
export interface CreditAnalysisResult {
  total_previous_bundle_credit: number;
  total_current_bundle_credit: number;
  credits_list: AnalyzedCreditItem[];
}

/**
 * Analiza los snapshots de créditos de un bundle actual y uno anterior,
 * junto con una lista de clientes, para generar un resumen.
 *
 * @param currentBundleCreditsSnap Snapshots de los créditos en el bundle actual.
 * @param previousBundleCreditsSnap Snapshots de los créditos en el bundle anterior (o null).
 * @param clientDocsSnap Snapshots de los documentos de los clientes.
 * @returns Un objeto con los totales de crédito y una lista detallada por cliente.
 */
export function analyzeCreditSnapshots(
  currentBundleCreditsSnap: QueryDocumentSnapshot<CreditInBundle>[],
  previousBundleCreditsSnap: QueryDocumentSnapshot<CreditInBundle>[] | null,
  clientDocsSnap: QueryDocumentSnapshot<ClientDocType>[]
): CreditAnalysisResult {
  const previousCreditsMap = new Map<string, number>();

  if (previousBundleCreditsSnap) {
    for (const creditDoc of previousBundleCreditsSnap) {
      const creditData = creditDoc.data();
      if (creditData.client_ref) {
        // Solo poblamos el mapa, el total se calculará después.
        previousCreditsMap.set(creditData.client_ref.path, creditData.amount);
      }
    }
  }

  let total_current_bundle_credit = 0;
  const currentCreditsMap = new Map<string, number>();
  // Mapa para almacenar el create_previus_amount de los créditos del bundle actual.
  const currentCreatedPreviousAmountsMap = new Map<string, number>();

  for (const creditDoc of currentBundleCreditsSnap) {
    const creditData = creditDoc.data();
    total_current_bundle_credit += creditData.amount;
    if (creditData.client_ref) {
      currentCreditsMap.set(creditData.client_ref.path, creditData.amount);
      // Guardamos el create_previus_amount.
      currentCreatedPreviousAmountsMap.set(
        creditData.client_ref.path,
        creditData.create_previus_amount
      );
    }
  }

  const credits_list: AnalyzedCreditItem[] = [];
  let total_previous_bundle_credit = 0; // Inicializamos el total aquí.

  for (const clientDoc of clientDocsSnap) {
    const clientRefPath = clientDoc.ref.path;

    const current_credit = currentCreditsMap.get(clientRefPath) ?? null;

    let last_credit_for_client: number | null; // Usamos una variable temporal para claridad
    const actual_last_credit_from_previous_bundle =
      previousCreditsMap.get(clientRefPath);
    const simulated_previous_credit_from_current =
      currentCreatedPreviousAmountsMap.get(clientRefPath);

    if (actual_last_credit_from_previous_bundle !== undefined) {
      last_credit_for_client = actual_last_credit_from_previous_bundle;
    } else if (simulated_previous_credit_from_current !== undefined) {
      // Se usa el valor de create_previus_amount del crédito actual como last_credit
      last_credit_for_client = simulated_previous_credit_from_current;
    } else {
      last_credit_for_client = null;
    }

    if (last_credit_for_client !== null) {
      total_previous_bundle_credit += last_credit_for_client;
    }

    // Calcula la diferencia:
    // Si last_credit es 1000 y current_credit es 500, difference = 500.
    // Si last_credit es 500 y current_credit es 1000, difference = -500.
    // Si last_credit es 1000 y current_credit es null, difference = 1000.
    // Si last_credit es null y current_credit es 500, difference = -500.
    // Si ambos son null, difference = 0.
    const difference = (last_credit_for_client ?? 0) - (current_credit ?? 0);

    credits_list.push({
      client: clientDoc,
      last_credit: last_credit_for_client,
      current_credit,
      difference,
    });
  }

  return {
    total_previous_bundle_credit,
    total_current_bundle_credit,
    credits_list,
  };
}
