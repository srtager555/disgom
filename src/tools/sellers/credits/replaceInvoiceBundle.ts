import {
  DocumentReference,
  DocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
// Firestore() es llamado internamente por disableBundle y createCreditBundle si es necesario.
import { creditBundle, creditBundleContainerDoc } from "./createBundle"; // Asume que exporta el tipo creditBundle
import { SellersDoc } from "../create"; // Asume que exporta el tipo SellersDoc
import { invoiceType } from "@/tools/invoices/createInvoice"; // Asume que exporta el tipo invoiceType
import { disableBundle } from "./disableBundle";
import { createCreditBundle } from "./createBundle";

interface ReplaceInvoiceBundleProps {
  invoice_snapshot: DocumentSnapshot<invoiceType>; // El snapshot del documento de la factura
  seller_ref: DocumentReference<SellersDoc>; // Necesario para createCreditBundle
  bundle_container_ref: DocumentReference<creditBundleContainerDoc> | null;
  pendingPreviousBundleId: string | null;
}

/**
 * Replaces the credit bundle associated with an invoice.
 * This operation involves:
 * 1. Identifying and disabling the current credit bundle linked to the invoice (if it exists).
 * 2. Creating a new credit bundle for the specified seller and invoice, linking it to a previous bundle if provided.
 * 3. Linking the new credit bundle to the invoice (done by `createCreditBundle`).
 *
 * @param invoice_snapshot Snapshot of the invoice document.
 * @param seller_ref Reference to the seller document, owner of the credit bundles.
 * @param previous_bundle_to_link_ref Reference to the bundle that should precede the new bundle, or null if it's the first.
 * @returns Promise<DocumentReference<creditBundle> | null> Reference to the newly created and associated credit bundle.
 *
 * @note The complete atomicity of this operation (disabling the old, creating the new, and updating the invoice)
 * is not guaranteed if `createCreditBundle` itself is not fully transactional. If `createCreditBundle`
 * fails after `disableBundle` (which is transactional) has succeeded, the old bundle will be
 * disabled, but the new one might not have been created or linked correctly. Review the
 * transactionality of `createCreditBundle` if strict atomicity for the entire operation is required.
 */
export async function replaceInvoiceBundle({
  invoice_snapshot,
  seller_ref,
  bundle_container_ref,
  pendingPreviousBundleId,
}: ReplaceInvoiceBundleProps): Promise<DocumentReference<creditBundle> | null> {
  console.log(
    `Starting replacement of credit bundle for invoice ${invoice_snapshot.id}`
  );

  if (!invoice_snapshot.exists()) {
    throw new Error(`Invoice ${invoice_snapshot.id} not found.`);
  }

  const invoice_data = invoice_snapshot.data();
  if (!invoice_data) {
    // Should not happen if invoice_snapshot.exists() is true, but good for type safety.
    throw new Error(
      `No data found for invoice ${invoice_snapshot.id}, though the document exists.`
    );
  }

  const invoice_ref = invoice_snapshot.ref;

  // 1. Get the reference to the current (old) credit bundle from the invoice data.
  const old_bundle_ref = invoice_data.credit_bundle_ref;

  // 2. Disable the old bundle if it exists
  if (old_bundle_ref) {
    console.log(
      `Invoice ${invoice_snapshot.id} has an existing bundle ${old_bundle_ref.id}. Attempting to disable it.`
    );
    try {
      await disableBundle({ bundle_ref: old_bundle_ref });
      console.log(
        `Old bundle ${old_bundle_ref.id} disabled successfully for invoice ${invoice_snapshot.id}.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to disable old bundle ${old_bundle_ref.id} for invoice ${invoice_snapshot.id}:`,
        error
      );
      // Critical failure: if we can't disable the old bundle, creating a new one
      // could lead to confusion or incorrect accounting.
      throw new Error(
        `Failed to disable existing bundle ${old_bundle_ref.id}. Aborting replacement. Original error: ${errorMessage}`
      );
    }
  } else {
    console.log(
      `Invoice ${invoice_snapshot.id} does not have an existing credit bundle to disable.`
    );
  }

  console.log("idk bruh", pendingPreviousBundleId);
  if (pendingPreviousBundleId === null) {
    // 3. Update the invoice bundle ref fielf to null
    await updateDoc(invoice_ref, {
      credit_bundle_ref: null,
    });
    console.log(
      `Invoice ${invoice_snapshot.id} has been changed their bundle to null.`
    );

    return null;
  }

  // 3. Create a new credit bundle.
  // createCreditBundle will also update the invoice_ref with the reference to the new bundle.
  console.log(
    `Creating new credit bundle for invoice ${invoice_snapshot.id} and seller ${seller_ref.id}.`
  );
  try {
    const new_bundle_ref = await createCreditBundle({
      seller_ref: seller_ref,
      invoice_ref: invoice_ref, // createCreditBundle uses this to update the invoice
      bundle_container_ref,
    });
    console.log(
      `New bundle ${new_bundle_ref.id} created successfully and associated with invoice ${invoice_snapshot.id}.`
    );
    return new_bundle_ref;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Failed to create new credit bundle for invoice ${invoice_snapshot.id}:`,
      error
    );
    // At this point, the old bundle (if it existed) is disabled.
    throw new Error(
      `Failed to create new bundle for invoice ${invoice_snapshot.id}. The old bundle (if it existed) was disabled. Original error: ${errorMessage}`
    );
  }
}
