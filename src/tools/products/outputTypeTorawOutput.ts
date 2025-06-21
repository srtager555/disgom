import { outputType } from "./addOutputs";

export function outputTypeToRawOutput(output: outputType) {
  return {
    product_ref: output.product_ref,
    entry_ref: output.entry_ref,
    amount: output.amount,
    sale_price: output.sale_price,
    purchase_price: output.purchase_price,
    commission: output.commission,
    default_custom_price_ref: output.default_custom_price_ref,
  };
}
