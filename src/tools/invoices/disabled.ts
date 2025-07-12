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

    // remove the inventory
    if (invoiceData?.devolution) {
      // await updateDoc(invoiceData.devolution, {
      //   disabled: true,
      // });

      let last_invoice;
      // update the devolution of the prev and next invoices
      if (invoiceData.prev_invoice_ref) {
        // update the next invoice from the last_invoice
        last_invoice = await getDoc(invoiceData.prev_invoice_ref);

        batch.update(last_invoice.ref, {
          next_invoice_ref: invoiceData.next_invoice_ref,
        }) as PartialWithFieldValue<invoiceType>;

        // await updateDoc(last_invoice.ref, {
        //   next_invoice_ref: invoiceData.next_invoice_ref,
        // } as PartialWithFieldValue<invoiceType>);
      }

      if (!invoiceData.next_invoice_ref) return;
      // update the last_inventory_ref and the prev invoice from the next_invoice
      const next_invoice = await getDoc(invoiceData.next_invoice_ref);

      batch.update(next_invoice.ref, {
        last_inventory_ref: last_invoice?.data()?.devolution || null,
        prev_invoice_ref: invoiceData.prev_invoice_ref,
      } as PartialWithFieldValue<invoiceType>);

      // await updateDoc(next_invoice.ref, {
      //   last_inventory_ref: last_invoice?.data()?.devolution || null,
      //   prev_invoice_ref: invoiceData.prev_invoice_ref,
      // } as PartialWithFieldValue<invoiceType>);
    }

    // Alert the next invoice
    if (invoiceData.next_invoice_ref) {
      batch.update(invoiceData.next_invoice_ref, {
        refresh_data: "deleted",
      } as PartialWithFieldValue<invoiceType>);

      // await updateDoc(invoiceData.next_invoice_ref, {
      //   refresh_data: "deleted",
      // } as PartialWithFieldValue<invoiceType>);
    }

    // check if there is a prev invoice to update
    if (invoiceData.prev_invoice_ref && invoiceData.next_invoice_ref) {
      batch.update(invoiceData.prev_invoice_ref, {
        next_invoice_ref: invoiceData.next_invoice_ref,
      } as PartialWithFieldValue<invoiceType>);

      // await updateDoc(invoiceData.prev_invoice_ref, {
      //   next_invoice_ref: invoiceData.next_invoice_ref,
      // } as PartialWithFieldValue<invoiceType>);
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
