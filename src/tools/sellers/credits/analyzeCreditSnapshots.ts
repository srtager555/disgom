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
  let total_previous_bundle_credit = 0;
  const previousCreditsMap = new Map<string, number>();

  if (previousBundleCreditsSnap) {
    for (const creditDoc of previousBundleCreditsSnap) {
      const creditData = creditDoc.data();
      total_previous_bundle_credit += creditData.amount;
      if (creditData.client_ref) {
        previousCreditsMap.set(creditData.client_ref.path, creditData.amount);
      }
    }
  }

  let total_current_bundle_credit = 0;
  const currentCreditsMap = new Map<string, number>();

  for (const creditDoc of currentBundleCreditsSnap) {
    const creditData = creditDoc.data();
    total_current_bundle_credit += creditData.amount;
    if (creditData.client_ref) {
      currentCreditsMap.set(creditData.client_ref.path, creditData.amount);
    }
  }

  const credits_list: AnalyzedCreditItem[] = [];

  for (const clientDoc of clientDocsSnap) {
    const clientRefPath = clientDoc.ref.path;

    const last_credit = previousCreditsMap.get(clientRefPath) ?? null;
    const current_credit = currentCreditsMap.get(clientRefPath) ?? null;

    // Calcula la diferencia:
    // Si last_credit es 1000 y current_credit es 500, difference = 500.
    // Si last_credit es 500 y current_credit es 1000, difference = -500.
    // Si last_credit es 1000 y current_credit es null, difference = 1000.
    // Si last_credit es null y current_credit es 500, difference = -500.
    // Si ambos son null, difference = 0.
    const difference = (last_credit ?? 0) - (current_credit ?? 0);

    credits_list.push({
      client: clientDoc,
      last_credit,
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
