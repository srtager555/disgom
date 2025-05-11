import { invoiceType } from "@/tools/invoices/createInvoice";
import { getInvoiceByQuery } from "@/tools/invoices/getInvoiceByQuery";
import { getProductOutputsByID } from "@/tools/products/getOutputs";
import { getProducts } from "@/tools/products/getProducts";
import { restaOutputs } from "@/tools/products/restaOutputs";
import { DisableCredits } from "@/tools/sellers/credits/create";
import { getDoc, PartialWithFieldValue, updateDoc } from "firebase/firestore";

export async function disabled() {
  try {
    const invoice = await getInvoiceByQuery();
    const invoiceData = invoice?.data();
    const products = await getProducts();

    if (!invoice) throw new Error("Invoice not found");
    if (!invoiceData) throw new Error("Invoice data not found");

    // disable invoice
    await updateDoc(invoice.ref, {
      disabled: true,
      delete_at: new Date(),
    });

    // remove the outputs
    await Promise.all(
      products.docs.map(async (el) => {
        const fetch = await getProductOutputsByID(el.id);
        if (!fetch) return;

        const { outputs, totalAmount } = fetch;
        if (!outputs || !totalAmount) return;

        return await restaOutputs(
          invoice,
          el,
          outputs,
          undefined,
          0,
          totalAmount,
          undefined
        );
      })
    );

    // remove the credits
    await DisableCredits(invoice);

    // remove the inventory
    if (invoiceData?.devolution) {
      await updateDoc(invoiceData.devolution, {
        disabled: true,
      });

      let last_invoice;
      // update the devolution of the prev and next invoices
      if (invoiceData.prev_invoice_ref) {
        // update the next invoice from the last_invoice
        last_invoice = await getDoc(invoiceData.prev_invoice_ref);
        await updateDoc(last_invoice.ref, {
          next_invoice_ref: invoiceData.next_invoice_ref,
        } as PartialWithFieldValue<invoiceType>);
      }

      if (!invoiceData.next_invoice_ref) return;
      // update the last_inventory_ref and the prev invoice from the next_invoice
      const next_invoice = await getDoc(invoiceData.next_invoice_ref);
      await updateDoc(next_invoice.ref, {
        last_inventory_ref: last_invoice?.data()?.devolution || null,
        prev_invoice_ref: invoiceData.prev_invoice_ref,
      } as PartialWithFieldValue<invoiceType>);
    }

    if (invoiceData.next_invoice_ref)
      await updateDoc(invoiceData.next_invoice_ref, {
        refresh_data: "deleted",
      } as PartialWithFieldValue<invoiceType>);
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    return true;
  }
}
