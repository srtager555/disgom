import { invoiceType } from "@/tools/invoices/createInvoice";
import { getInvoiceByQuery } from "@/tools/invoices/getInvoiceByQuery";
import { getProductOutputsByID } from "@/tools/products/getOutputs";
import { getProducts } from "@/tools/products/getProducts";
import { restaOutputs } from "@/tools/products/restaOutputs";
import { getDoc, PartialWithFieldValue, writeBatch } from "firebase/firestore";
import { Firestore } from "../firestore";

export async function disabled() {
  const db = Firestore();
  const batch = writeBatch(db);

  try {
    const invoice = await getInvoiceByQuery();
    const invoiceData = invoice?.data();
    const products = await getProducts();

    if (!invoice) throw new Error("Invoice not found");
    if (!invoiceData) throw new Error("Invoice data not found");

    // disable invoice
    batch.update(invoice.ref, {
      disabled: true,
      delete_at: new Date(),
    });
    // await updateDoc(invoice.ref, {
    //   disabled: true,
    //   delete_at: new Date(),
    // });

    // remove the outputs
    await Promise.all(
      products.docs.map(async (el) => {
        const fetch = await getProductOutputsByID(el.id);
        if (!fetch) return;

        const { outputs, totalAmount } = fetch;
        if (!outputs || !totalAmount) return;

        console.log(
          "Starting to reduce the outputs to return the product to the stock"
        );
        restaOutputs(
          invoice,
          el,
          outputs,
          undefined,
          0,
          totalAmount,
          undefined,
          () => {},
          batch
        );

        return true;
      })
    );

    // remove the credits
    const bundle_ref = invoice.data()?.credit_bundle_ref;
    if (bundle_ref) {
      const bundleToDisable = await getDoc(bundle_ref);
      const data = bundleToDisable.data();
      if (!data) return;

      const next_bundle = data.next_bundle;
      const prev_bundle = data.last_bundle;
      const container = data.bundle_container_ref;

      // first we need update the prev and next bundles
      if (next_bundle) {
        // now the next bundle has the prev bundle from the current bundle
        batch.update(next_bundle, {
          last_bundle: prev_bundle,
        });
      }
      if (prev_bundle) {
        // the prev bundle now has the next bundle from the current bundle
        batch.update(prev_bundle, {
          next_bundle: next_bundle,
        });
      }

      // now we need update the bundle container to show the current free bundle
      // if the prev and next bundle is null disable the container
      if (!prev_bundle && !next_bundle) {
        batch.update(container, {
          disabled: true,
        });
      }

      // if next bundle is null and prev is not null,
      // update the current_free_bundle with the prev bundle
      if (!next_bundle && prev_bundle) {
        batch.update(container, {
          current_free_bundle: prev_bundle,
        });
      }

      batch.update(bundle_ref, {
        disabled: true,
      });

      // await DisableCredits(invoice);
    }

    // update the prev and next invoice
    // first update the prev invoice with the next in the current invoice
    if (invoiceData?.prev_invoice_ref) {
      batch.update(invoiceData.prev_invoice_ref, {
        next_invoice_ref: invoiceData.prev_invoice_ref,
      }) as PartialWithFieldValue<invoiceType>;
    }

    // second, update the next invoice with the prev current invoice
    if (invoiceData?.next_invoice_ref) {
      batch.update(invoiceData.next_invoice_ref, {
        prev_invoice_ref: invoiceData.prev_invoice_ref,
        // Alert the next invoice about the deletion
        refresh_data: "deleted",
      }) as PartialWithFieldValue<invoiceType>;
    }
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    console.log("Committing batch (delete invoice)");
    await batch.commit();

    return true;
  }
}
